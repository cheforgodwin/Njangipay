import axios from 'axios';

export default async function handler(request, response) {
  // Allow CORS from your local and vercel domains
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    const { query } = request.body;
    if (!query) {
      return response.status(400).json({ error: "Missing query" });
    }

    // Access the API key from Vercel's environment variables
    const apiKey = process.env.VITE_AI_API_KEY;
    if (!apiKey) {
      return response.status(500).json({ error: "Backend unconfigured (Missing API Key)" });
    }

    const prompt = `Role: NjangiPay Elite Financial AI. Concise (max 3 sentences). Context: Savings/Loans platform. ${query}`;

    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const aiText = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return response.status(200).json({ text: aiText || "I couldn't generate a response." });

  } catch (error) {
    console.error("Vercel AI Error:", error.message);
    return response.status(500).json({ 
      error: "AI Unavailable", 
      details: error.message 
    });
  }
}
