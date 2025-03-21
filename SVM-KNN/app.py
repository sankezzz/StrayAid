from flask import Flask, request, render_template, jsonify
import os
import cv2
import numpy as np
import joblib
import torch
import json
import torchvision.transforms as transforms
from torchvision import models
from werkzeug.utils import secure_filename
from PIL import Image
import requests

app = Flask(__name__)

# Load the trained SVM model
svm_model = joblib.load("injury_classification_svm.pkl")

# Load pre-trained ResNet for feature extraction
resnet = models.resnet50(pretrained=True)
resnet = torch.nn.Sequential(*list(resnet.children())[:-1])  # Remove last FC layer
resnet.eval()

# Define image transformations
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

UPLOAD_FOLDER = "uploads"
JSON_FILE = "imagedata.json"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Function to read & update JSON file
def read_json():
    if not os.path.exists(JSON_FILE):
        return []
    with open(JSON_FILE, "r") as file:
        try:
            return json.load(file)
        except json.JSONDecodeError:
            return []

def write_json(data):
    with open(JSON_FILE, "w") as file:
        json.dump(data, file, indent=4)

# Function to predict injury status
def predict_image(image_path):
    img = Image.open(image_path).convert("RGB")
    img_tensor = transform(img).unsqueeze(0)

    with torch.no_grad():
        feature = resnet(img_tensor).squeeze().numpy().flatten()

    prediction = svm_model.predict([feature])[0]
    return "Injured" if prediction == 0 else "Not Injured"

# API to store and retrieve predictions with case ID
@app.route("/api/result", methods=["GET", "POST"])
def api_result():
    if request.method == "POST":
        data = request.get_json()  

        if not data or "prediction" not in data or "image_path" not in data:
            return jsonify({"error": "Invalid request, 'prediction' or 'image_path' missing"}), 400

        # Read current data
        json_data = read_json()
        case_id = len(json_data) + 1  # Auto-increment case ID

        new_entry = {
            "case_id": case_id,
            "prediction": data["prediction"],
            "image_path": data["image_path"]
        }

        json_data.append(new_entry)
        write_json(json_data)  # Save to JSON file

        return jsonify({"status": "success", "message": "Prediction stored", "case_id": case_id}), 200

    elif request.method == "GET":
        json_data = read_json()
        if not json_data:
            return jsonify({"message": "No prediction data available"}), 404
        return jsonify(json_data), 200

# Homepage route to upload and process images
@app.route("/", methods=["GET", "POST"])
def upload_file():
    if request.method == "POST":
        if "file" not in request.files:
            return "No file part"
        file = request.files["file"]
        if file.filename == "":
            return "No selected file"
        if file:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)

            # Get prediction
            result = predict_image(filepath)

            # Send result to API
            api_url = "http://localhost:5000/api/result"
            payload = {"prediction": result, "image_path": filepath}
            try:
                response = requests.post(api_url, json=payload)
                api_response = response.json()
            except requests.exceptions.RequestException as e:
                api_response = {"error": str(e)}

            return render_template("index.html", prediction=result, image_path=filepath, api_response=api_response)

    return render_template("index.html", prediction=None, image_path=None, api_response=None)


if __name__ == "__main__":
    app.run(debug=True)
