// api/generate-text.js
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = await request.json();
  if (!prompt) {
    return response.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 300 } })
      }
    );

    const data = await hfResponse.json();
    const text = data[0]?.generated_text || "Erro na geração.";

    response.status(200).json({ text });
  } catch (error) {
    console.error("Erro:", error);
    response.status(500).json({ error: 'Falha na geração de texto' });
  }
}