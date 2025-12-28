
import { GoogleGenAI, Type } from "@google/genai";
import { ChartDataPoint } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiResponse = async (
  prompt: string, 
  history: { role: string, parts: any[] }[],
  attachments?: string[]
) => {
  const parts: any[] = [{ text: prompt }];
  
  if (attachments && attachments.length > 0) {
    attachments.forEach(base64 => {
      const mimeType = base64.split(';')[0].split(':')[1];
      const data = base64.split(',')[1];
      parts.push({
        inlineData: { mimeType, data }
      });
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: history.concat([{ role: 'user', parts }]),
    config: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
    }
  });

  return response.text || "I couldn't generate a response.";
};

export const generateChatTitle = async (messages: { role: string, text: string }[]) => {
  const conversationSummary = messages.map(m => `${m.role}: ${m.text}`).join('\n');
  const prompt = `Based on the following conversation snippets, generate a concise, representative title (3-5 words maximum). Do NOT use generic titles like "Chat Session" or "New Conversation". Return ONLY the title text:\n\n${conversationSummary}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  return response.text?.trim().replace(/^"|"$/g, '') || "New Conversation";
};

export const getStructuredAnalysis = async (prompt: string): Promise<{ text: string, chartData?: ChartDataPoint[], chartType?: string }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze the following request and provide a summary text and associated data for visualization if applicable: ${prompt}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          hasData: { type: Type.BOOLEAN },
          chartType: { type: Type.STRING, enum: ['bar', 'line', 'pie'] },
          data: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER }
              },
              required: ['name', 'value']
            }
          }
        },
        required: ['summary', 'hasData']
      }
    }
  });

  try {
    const parsed = JSON.parse(response.text || '{}');
    return {
      text: parsed.summary,
      chartData: parsed.hasData ? parsed.data : undefined,
      chartType: parsed.chartType
    };
  } catch (e) {
    return { text: response.text || "Error processing data." };
  }
};

export const generateImage = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
