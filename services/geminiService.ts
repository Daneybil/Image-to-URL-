
import { GoogleGenAI } from "@google/genai";

export const generateImageDescription = async (base64Image: string): Promise<string> => {
  try {
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
    if (!apiKey) {
      console.warn("API Key not found, skipping AI description.");
      return "A shared image via SnapHost.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Strip the data:image/jpeg;base64, part if present
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: "Describe this image in one concise and engaging sentence for a social media sharing preview." }
        ]
      },
      config: {
        maxOutputTokens: 100,
        temperature: 0.7
      }
    });

    return response.text || "A beautiful shared image.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "A shared image via SnapHost.";
  }
};
