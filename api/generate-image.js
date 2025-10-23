// api/generate-image.js
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
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    const buffer = await hfResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${base64}`;

    response.status(200).json({ image: imageDataUrl });
  } catch (error) {
    console.error("Erro:", error);
    response.status(500).json({ error: 'Falha na geração de imagem' });
  }
}