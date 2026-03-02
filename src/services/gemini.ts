import { GoogleGenAI, Modality, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getGeminiResponse = async (prompt: string, context?: any) => {
  if (!apiKey) return "API Key not configured.";
  
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const systemInstruction = `
    You are 'Agro Mitra AI'. Your primary goal is to minimize 'Crop Failure Risk'.
    
    1. Context Awareness: You have access to the user's Current Location (e.g., ${context?.region || 'Jalgaon'}) and Soil Type (e.g., ${context?.soilType || 'Black Soil'}).
    2. Sowing Queries: Whenever the user asks about 'Sowing' (beej bona), you MUST provide advice considering the March 2026 weather forecast and a humidity level of 65%.
    3. Temperature Rule: If the temperature in the region is predicted to be above 35°C, you MUST automatically suggest 'Mulching' or 'Drip Irrigation' to conserve moisture and protect crops.
    4. AI Phytopathologist Mode: You are also an AI Phytopathologist (Plant Disease Expert). When analyzing images of crop leaves, stems, or fruits:
       - Identify the crop type.
       - Detect signs of pests, fungal infections, or nutrient deficiencies.
       - Provide the name of the disease in English and Hindi.
       - Suggest a '3-Step Cure': (a) Immediate physical action, (b) Organic/Desi remedy, (c) Recommended chemical pesticide as a last resort.
    5. Language Rule: You MUST respond in the language specified in the context. 
       - If language is 'hi_en' (Hinglish), use a mix of Hindi and English (e.g., 'Mitti', 'Khad', 'Mandi', 'Risk', 'Climate').
       - If language is 'hi', use pure Hindi.
       - If language is 'mr', use pure Marathi.
       - If language is 'en', use pure English.
       - DO NOT use Hinglish unless the language is explicitly 'hi_en'.
    6. Source Attribution & Reliability Rule: 
       - Every response providing agricultural advice, crop recommendations, or weather alerts MUST include a 'Source Attribution' (Srota) and a 'Confidence Score'.
       - Weather Alerts: Mention 'Source: IMD (India Meteorological Department)'.
       - Crop/Soil Advice: Mention 'Source: ICAR (Indian Council of Agricultural Research)' or 'State Agricultural University guidelines'.
       - Market Rates: Mention 'Source: Agmarknet / Local Mandi Records'.
       - Format: End the response with a separate line: 'Yeh jankari [Source Name] ke data par aadharit hai. Confidence: [Score]%'.
    7. Next Step Rule: At the end of EVERY response, you MUST ask a 'Next Step' question to guide the farmer (e.g., 'Kya aap market rates check karna chahte hain?' or 'Would you like to see the sowing calendar?').
    
    Keep answers simple, practical, and encouraging. Use bullet points or numbered lists for clarity.
    Current context: ${JSON.stringify(context || {})}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I am having trouble connecting right now.";
  }
};

export const analyzeCropImage = async (base64Image: string, context?: any) => {
  if (!apiKey) return null;
  
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `
    Analyze this image from a farm in ${context?.region || 'Jalgaon'}.
    
    What is the most likely diagnosis?
    
    Give a 'Confidence Score' (e.g., 90% sure it is Powderly Mildew).
    
    Explain the cause (e.g., 'Zyada humidity ki wajah se').
    
    Is this contagious? Should the farmer isolate these plants?
    
    Keep the tone helpful and use simple Hinglish for the explanation.
    
    Follow the 'AI Phytopathologist' guidelines:
    - Identify crop type.
    - Detect pests/fungal/nutrient issues.
    - Name disease in English and Hindi.
    - Provide '3-Step Cure': (a) Physical, (b) Organic, (c) Chemical.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cropType: { type: Type.STRING },
            diagnosis: { type: Type.STRING },
            diseaseNameEnglish: { type: Type.STRING },
            diseaseNameHindi: { type: Type.STRING },
            confidenceScore: { type: Type.STRING },
            cause: { type: Type.STRING },
            isContagious: { type: Type.BOOLEAN },
            isolationRequired: { type: Type.BOOLEAN },
            threeStepCure: {
              type: Type.OBJECT,
              properties: {
                physical: { type: Type.STRING },
                organic: { type: Type.STRING },
                chemical: { type: Type.STRING }
              },
              required: ["physical", "organic", "chemical"]
            },
            explanation: { type: Type.STRING },
            source: { type: Type.STRING, description: "Source of this information (e.g., ICAR, IMD)" },
            nextStep: { type: Type.STRING }
          },
          required: ["cropType", "diagnosis", "diseaseNameEnglish", "diseaseNameHindi", "confidenceScore", "cause", "isContagious", "isolationRequired", "threeStepCure", "explanation", "source", "nextStep"]
        }
      },
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    return null;
  }
};

export const getDynamicCropRecommendations = async (region: string, soil: string, month: string) => {
  if (!apiKey) return null;
  
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `
    Analyze the agricultural potential for:
    Location: ${region}
    Soil Type: ${soil}
    Current Month: ${month}

    Instructions:
    1. Fetch the typical climate patterns and current weather anomalies for ${region} using Google Search.
    2. Identify all crops compatible with ${soil} and can be sown in ${month}.
    3. Filter this list to prioritize Climate-Resilient crops (those that handle unpredictable rain or heat specific to this region).
    4. Provide a JSON list of these crops.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              duration: { type: Type.STRING, description: "Growth duration (e.g., 90-100 days)" },
              riskLevel: { type: Type.NUMBER, description: "Risk Level from 1 to 10" },
              resilience: { type: Type.STRING, description: "Resilience level (e.g., High, Very High)" },
              reason: { type: Type.STRING, description: "Why it is recommended for this specific soil and region" },
              variety: { type: Type.STRING, description: "Specific climate-resilient variety name" },
              source: { type: Type.STRING, description: "Source of this recommendation (e.g., ICAR)" },
              confidenceScore: { type: Type.STRING, description: "Confidence score (e.g., 95%)" }
            },
            required: ["name", "duration", "riskLevel", "resilience", "reason", "variety", "source", "confidenceScore"]
          }
        }
      },
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Dynamic Recommendations Error:", error);
    return null;
  }
};

export const getCropComparison = async (crop1: any, crop2: any, region: string, soil: string) => {
  if (!apiKey) return null;
  
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `
    Compare these two crops for a farm in ${region} with ${soil} soil:
    Crop 1: ${JSON.stringify(crop1)}
    Crop 2: ${JSON.stringify(crop2)}

    Provide a JSON object with a comparison of key factors:
    1. Yield Potential
    2. Water Requirement
    3. Market Demand
    4. Pest Resistance
    5. Climate Resilience
    6. Overall Recommendation (which one is better and why)
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            factors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  factor: { type: Type.STRING },
                  crop1Value: { type: Type.STRING },
                  crop2Value: { type: Type.STRING },
                  winner: { type: Type.NUMBER, description: "1 if crop 1 is better, 2 if crop 2 is better, 0 if equal" }
                },
                required: ["factor", "crop1Value", "crop2Value", "winner"]
              }
            },
            verdict: { type: Type.STRING, description: "Final expert advice on which to choose" },
            source: { type: Type.STRING, description: "Source of this comparison data" },
            confidenceScore: { type: Type.STRING, description: "Confidence score for this comparison" }
          },
          required: ["factors", "verdict", "source", "confidenceScore"]
        }
      },
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Comparison Error:", error);
    return null;
  }
};

export const moderateChaupalPost = async (postContent: string, region: string) => {
  if (!apiKey) return null;
  
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are the 'Kisan Chaupal' Community Moderator for Agro Mitra.
    
    User Post: "${postContent}"
    Region: ${region}
    
    Tasks:
    1. Categorize the post into 'Success Story' (Prerna) or 'Alert' (Savdhani).
    2. If it's an 'Alert' (e.g., Locust/Tiddi Dal attack, sudden pest outbreak, extreme weather), verify it against current regional trends for ${region} using your knowledge and Google Search.
    3. If verified, add an 'AI Verified' tag.
    4. Filter out fake news, hate speech, or unscientific 'totkas' (superstitious remedies). If the post is invalid, set 'isValid' to false.
    5. Provide a short moderation summary or response.
    
    Return a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ["Success Story", "Alert", "General"] },
            isVerified: { type: Type.BOOLEAN },
            isValid: { type: Type.BOOLEAN },
            moderationNote: { type: Type.STRING },
            suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["category", "isVerified", "isValid", "moderationNote", "suggestedTags"]
        }
      },
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Moderation Error:", error);
    return null;
  }
};

export const speakText = async (text: string) => {
  if (!apiKey) return;
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audio.play();
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
};
