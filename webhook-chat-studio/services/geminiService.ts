
import { GoogleGenAI, Type } from "@google/genai";
import { Message } from "../types";

// Note: process.env.API_KEY is handled by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartSuggestions = async (history: Message[]): Promise<string[]> => {
  if (history.length === 0) return ["Hello!", "How can you help?", "Tell me a joke."];

  try {
    const chatContext = history.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this chat history, generate 3 short, helpful follow-up messages the user might want to send next. 
      Return them as a JSON array of strings.
      
      Chat Context:
      ${chatContext}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const suggestions = JSON.parse(response.text || "[]");
    return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};
