const axios = require('axios');
const apiKey = 'AIzaSyD4F2nXmw3KV8zDqlVhH4QigqzlnK3tFy8';
const prompt = "Say 'API Key is working!'";

async function testApiKey() {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log(res.data.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testApiKey();
