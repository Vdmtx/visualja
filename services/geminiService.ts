// geminiService.ts

// Importa os pacotes necessários para interagir com a API do Google Gemini
import { GoogleGenAI } from "@google/genai";

// --- Configuração da API do Gemini ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- Função para gerar texto usando Gemini ---
export async function generateText(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating text with Gemini:", error);
    throw new Error("Failed to generate text content from Gemini.");
  }
}

// --- Função para gerar JSON usando Gemini ---
export async function generateJson(prompt: string, schema: any): Promise<any> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });
        return JSON.parse(response.text);
    } catch(error) {
        console.error("Error generating JSON with Gemini:", error);
        throw new Error("Failed to generate JSON content from Gemini.");
    }
}

// --- Função para gerar imagem usando Hugging Face ---
export async function generateImage(prompt: string): Promise<string> {
  const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

  if (!HF_TOKEN) {
    console.error("HF_TOKEN environment variable is not set.");
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }

  const MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0";

  try {
    console.log("🖼️ Iniciando geração de imagem com Hugging Face...");
    console.log("📝 Prompt:", prompt);

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    console.log("📡 Status da resposta:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Hugging Face API error:", errorText);
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }

    const blob = await response.blob();
    console.log("✅ Blob recebido. Tipo:", blob.type, "Tamanho:", blob.size);

    const base64 = await blobToBase64(blob);
    console.log("✅ Base64 gerado. Tamanho:", base64.length);

    if (!base64.startsWith('data:image/')) {
      console.error("❌ Base64 inválido. Retornando imagem padrão.");
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("❌ Error generating image with Hugging Face:", error);
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }
}

// Função auxiliar para converter Blob em Base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}