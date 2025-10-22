// geminiService.ts

// Importa os pacotes necessários para interagir com a API do Google Gemini
import { GoogleGenAI } from "@google/genai";

// --- Configuração da API do Gemini ---
// Lê a chave de API do Gemini do ambiente (arquivo .env)
// A variável de ambiente deve ser definida como VITE_GEMINI_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Lança um erro se a chave do Gemini não estiver definida no .env
if (!GEMINI_API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY environment variable is not set.");
}

// Inicializa a instância da API do Gemini
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- Função para gerar texto usando o modelo Gemini ---
// Recebe um prompt de texto como entrada
// Retorna uma Promise que resolve para uma string contendo o texto gerado
export async function generateText(prompt: string): Promise<string> {
  try {
    // Faz uma chamada à API do Gemini usando o modelo 'gemini-2.5-pro'
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // Modelo específico para geração de texto
      contents: prompt, // O prompt enviado para a IA
    });

    // Retorna apenas o texto da resposta
    return response.text;
  } catch (error) {
    // Imprime o erro no console do servidor
    console.error("Error generating text with Gemini:", error);
    // Lança um erro genérico que pode ser capturado pelo App.tsx
    throw new Error("Failed to generate text content from Gemini.");
  }
}

// --- Função para gerar JSON usando o modelo Gemini ---
// Recebe um prompt de texto e um esquema (schema) para formatar a resposta
// Retorna uma Promise que resolve para um objeto JavaScript
export async function generateJson(prompt: string, schema: any): Promise<any> {
  try {
    // Faz uma chamada à API do Gemini usando o modelo 'gemini-2.5-flash'
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Modelo específico para geração de JSON
      contents: prompt, // O prompt enviado para a IA
      config: {
        // Especifica que a resposta deve ser um JSON
        responseMimeType: 'application/json',
        // Opcional: Define o esquema esperado (nem sempre é suportado)
        responseSchema: schema
      }
    });

    // Converte a string JSON retornada em um objeto JavaScript
    return JSON.parse(response.text);
  } catch (error) {
    // Imprime o erro no console do servidor
    console.error("Error generating JSON with Gemini:", error);
    // Lança um erro genérico que pode ser capturado pelo App.tsx
    throw new Error("Failed to generate JSON content from Gemini.");
  }
}

// --- Função para gerar imagem usando a API do Hugging Face ---
// Recebe um prompt de texto para descrever a imagem desejada
// Retorna uma Promise que resolve para uma string no formato 'data:image/...;base64,...'
export async function generateImage(prompt: string): Promise<string> {
  // Lê a chave de API do Hugging Face do ambiente (arquivo .env)
  // A variável de ambiente deve ser definida como VITE_HF_TOKEN
  const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

  // Verifica se a chave do Hugging Face está definida
  if (!HF_TOKEN) {
    console.error("HF_TOKEN environment variable is not set.");
    // Retorna uma imagem padrão (um quadrado branco em base64) se a chave não estiver definida
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }

  // Define o ID do modelo de IA a ser usado na API do Hugging Face
  // Este é o modelo Stable Diffusion XL, conhecido por gerar imagens de alta qualidade
  const MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0";

  try {
    // Faz uma requisição POST para a API do Hugging Face
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL_ID}`,
      {
        method: "POST", // O método HTTP usado para enviar dados
        headers: {
          // Cabeçalho de autorização com o token do Hugging Face
          Authorization: `Bearer ${HF_TOKEN}`,
          // Cabeçalho indicando que o corpo da requisição é JSON
          "Content-Type": "application/json",
        },
        // O corpo da requisição contém o prompt para gerar a imagem
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    // Verifica se a resposta da API foi bem-sucedida (status 200-299)
    if (!response.ok) {
      // Lê o corpo da resposta para obter detalhes do erro
      const errorText = await response.text();
      // Imprime o erro no console do servidor
      console.error("Hugging Face API error response:", errorText);
      // Retorna uma imagem padrão em caso de erro HTTP
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }

    // Converte a resposta (que é uma imagem binária) em um objeto Blob
    const blob = await response.blob();

    // Converte o Blob em uma string base64
    const base64 = await blobToBase64(blob);

    // Retorna a imagem como uma string base64, que pode ser usada diretamente no src de uma tag <img>
    // O formato é 'data:image/png;base64,...'
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    // Captura qualquer erro que ocorra durante o fetch ou conversão
    console.error("Error generating image with Hugging Face:", error);
    // Retorna uma imagem padrão em caso de qualquer outro tipo de erro (ex: rede, timeout)
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }
}

// --- Função auxiliar para converter Blob em Base64 ---
// Recebe um objeto Blob como entrada
// Retorna uma Promise que resolve para uma string base64
function blobToBase64(blob: Blob): Promise<string> {
  // Cria uma nova Promise para lidar com a leitura assíncrona do Blob
  return new Promise((resolve, reject) => {
    // Cria um objeto FileReader para ler o conteúdo do Blob
    const reader = new FileReader();
    // Define o que fazer quando a leitura for concluída com sucesso
    reader.onloadend = () => resolve(reader.result as string); // Converte o resultado para string
    // Define o que fazer se ocorrer um erro durante a leitura
    reader.onerror = reject;
    // Inicia a leitura do Blob como uma URL de dados (data URL)
    reader.readAsDataURL(blob);
  });
}