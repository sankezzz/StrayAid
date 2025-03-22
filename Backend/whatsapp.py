import time
import urllib.parse
import webbrowser
import pyautogui
from nlp import final_report

# ------------------ CONFIG ------------------
whatsapp_number = "+919923390452"  # ✅ Apna number daalo
message = final_report

# ------------------ ENCODE MESSAGE ------------------
encoded_message = urllib.parse.quote(message)  # ✅ Encode special characters
whatsapp_url = f"whatsapp://send?phone={whatsapp_number}&text={encoded_message}"

# ------------------ OPEN WHATSAPP APP ------------------
print("⏳ Opening WhatsApp Desktop App...")
webbrowser.open(whatsapp_url)

# ✅ Thoda wait karo taki message box load ho jaye
time.sleep(5)

# ------------------ AUTOMATICALLY PRESS ENTER ------------------
print("⏳ Sending message...")
pyautogui.press("enter")  # ✅ Message Automatically Send Hoga

print("✅ Message Sent Successfully! 🚀")
