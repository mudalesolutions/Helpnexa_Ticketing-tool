
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface TriageResult {
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category: string;
  suggestedAction: string;
}

export const triageTicket = async (title: string, description: string): Promise<TriageResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Triage this IT support ticket:
      Title: ${title}
      Description: ${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: {
              type: Type.STRING,
              description: 'The urgency of the ticket.',
              enum: ['Low', 'Medium', 'High', 'Urgent'],
            },
            category: {
              type: Type.STRING,
              description: 'The IT category of the issue (e.g. Hardware, Software, Network, Access, etc).',
            },
            suggestedAction: {
              type: Type.STRING,
              description: 'A brief suggested first step for the agent.',
            }
          },
          required: ['priority', 'category', 'suggestedAction']
        },
      },
    });

    return JSON.parse(response.text.trim()) as TriageResult;
  } catch (error) {
    console.error("Gemini triage failed:", error);
    // Fallback values
    return {
      priority: 'Medium',
      category: 'General',
      suggestedAction: 'Wait for agent review.'
    };
  }
};

export const summarizeComments = async (comments: string[]): Promise<string> => {
    if (comments.length === 0) return "No comments yet.";
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize the following support ticket conversation into a single concise sentence:
        ${comments.join('\n')}`,
      });
      return response.text || "Could not summarize.";
    } catch (e) {
      return "Summary unavailable.";
    }
}
