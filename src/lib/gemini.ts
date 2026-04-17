import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function identifyTree(imageBase64: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
          {
            text: "Identify this tree species. Provide the common name, scientific name, and a brief description. Focus on species commonly found in the temperate regions like Kashmir, India if applicable.",
          },
        ],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function getResearchSummary(speciesName: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a structured research summary for the tree species: ${speciesName}. 
      Include sections for: 
      1. Habitat and Distribution (especially in Kashmir/Himalayas)
      2. Silvicultural characteristics
      3. Key research areas
      4. Conservation status
      Use Markdown formatting.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
