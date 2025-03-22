import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, PawPrint, Loader2 } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const quickResponses = [
  "My pet is bleeding",
  "Pet is not breathing",
  "Pet has eaten something toxic",
  "Pet is limping",
  "Pet has a high fever"
];

const firstAidInstructions = {
  "bleeding": `1. Stay calm and approach the animal carefully
2. Apply direct pressure with a clean cloth
3. If bleeding continues, add more cloth without removing the first layer
4. Keep the animal warm and calm
5. Seek immediate veterinary care`,

  "not breathing": `1. Check for airway obstructions
2. If no obstruction, begin rescue breathing:
   - Close mouth and breathe through nose
   - 20-30 breaths per minute for small animals
   - 12-20 breaths per minute for larger animals
3. Check for pulse
4. Begin chest compressions if needed
5. Seek emergency veterinary care immediately`,

  "toxic": `1. Do NOT induce vomiting without veterinary advice
2. Remove any remaining toxin from reach
3. Collect sample/packaging of the toxic substance
4. Note time of ingestion
5. Contact pet poison helpline or veterinarian immediately
6. Monitor breathing and consciousness`,

  "limping": `1. Restrict movement and keep pet calm
2. Check for visible injuries (cuts, swelling, heat)
3. Apply cold compress if swelling present
4. Do not force movement
5. Seek veterinary care for proper diagnosis`,

  "fever": `1. Normal temperature ranges:
   - Dogs: 101-102.5°F (38.3-39.2°C)
   - Cats: 100.4-102.5°F (38-39.2°C)
2. Cool water-soaked towels on paws and ears
3. Ensure access to fresh water
4. Do not give human medications
5. Seek veterinary care if temperature exceeds 103°F (39.4°C)`
};

const DEEPSEEK_API_KEY = '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';

const VirtualVet = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your Virtual Vet Assistant. How can I help you provide first aid to the animal? Please describe the situation or select from common emergencies below.",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getAIResponse = async (userInput: string) => {
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-zero',
          messages: [
            {
              role: 'system',
              content: `You are a veterinary first aid assistant. Provide clear, concise emergency first aid instructions for animals. 
              Always prioritize safety and emphasize the importance of seeking professional veterinary care. 
              Include step-by-step instructions and important warnings when necessary.`
            },
            {
              role: 'user',
              content: userInput
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return null;
    }
  };

  const getFirstAidInstructions = (input: string) => {
    const lowercaseInput = input.toLowerCase();
    if (lowercaseInput.includes('bleeding')) return firstAidInstructions.bleeding;
    if (lowercaseInput.includes('not breathing') || lowercaseInput.includes('breathing')) return firstAidInstructions["not breathing"];
    if (lowercaseInput.includes('toxic') || lowercaseInput.includes('eaten')) return firstAidInstructions.toxic;
    if (lowercaseInput.includes('limp')) return firstAidInstructions.limping;
    if (lowercaseInput.includes('fever')) return firstAidInstructions.fever;
    return null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Get predefined instructions or AI response
    const predefinedInstructions = getFirstAidInstructions(input);
    let responseText = predefinedInstructions;

    if (!predefinedInstructions) {
      const aiResponse = await getAIResponse(input);
      responseText = aiResponse || "I apologize, but I'm having trouble connecting to the AI service. Here's a general recommendation: For any animal emergency, the most important steps are to stay calm, ensure your safety, prevent further injury, and seek professional veterinary care as soon as possible.";
    }

    const botResponse: Message = {
      id: messages.length + 2,
      text: responseText,
      isBot: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botResponse]);
    setIsLoading(false);
  };

  return (
    <Card className="w-full bg-white shadow-lg hover:shadow-xl transition-shadow border-gray-200">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <PawPrint className="w-5 h-5" />
          Virtual Vet First Aid Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[500px] flex flex-col">
          {/* Quick Response Buttons */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm text-gray-700 mb-2">Common Emergencies:</p>
            <div className="flex flex-wrap gap-2">
              {quickResponses.map((response, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-gray-800 border-gray-200 hover:bg-gray-50"
                  onClick={() => {
                    setInput(response);
                    handleSend();
                  }}
                >
                  {response}
                </Button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isBot
                        ? 'bg-gray-50 text-gray-900'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 text-gray-900 rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Describe the animal's condition..."
                className="border-gray-200 focus:ring-gray-500"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                className="bg-gray-800 hover:bg-gray-900 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VirtualVet; 