const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { PredictionServiceClient } = require("@google-cloud/aiplatform");
const axios = require("axios");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// Initialize the AI Platform Prediction Service Client
const aiClient = new PredictionServiceClient();

/**
 * Cloud Function to get AI response for the chat assistant.
 * Using onRequest with manual CORS for maximum compatibility.
 */
exports.getAiResponse = onRequest({ maxInstances: 10 }, (request, response) => {
  cors(request, response, async () => {
    try {
      // 1. Validate request
      const userQuery = request.body?.query;
      if (!userQuery) {
        return response.status(400).send({ error: "No query provided." });
      }

      // 2. Fetch API Key
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_AI_API_KEY;
      if (!apiKey) {
        console.error("CRITICAL: GEMINI_API_KEY is missing.");
        return response.status(500).send({ error: "AI Backend unconfigured." });
      }

      const prompt = `You are the NjangiPay Financial AI Expert. User Query: ${userQuery}. (Keep it concise, under 3 sentences).`;

      // 3. API Call
      const geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
      );

      const aiText = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
      return response.send({ text: aiText || "I couldn't generate a response." });

    } catch (error) {
      console.error("Function Error:", error.message);
      return response.status(500).send({ 
        error: "The AI is momentarily unavailable.",
        details: error.message 
      });
    }
  });
});

/**
 * Cloud Function to calculate AI Risk Score for a borrower.
 * Triggers every time a new transaction is added.
 */
exports.calculateAiRisk = onDocumentCreated("transactions/{transactionId}", async (event) => {
  const transactionData = event.data.data();
  const userId = transactionData.user_id;

  if (!userId) {
    console.error("Missing userId in transaction data.");
    return;
  }

  try {
    // 1. Fetch user transaction history
    const transactionsSnapshot = await admin.firestore()
      .collection("transactions")
      .where("user_id", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    const history = transactionsSnapshot.docs.map(doc => doc.data());

    // 2. Prepare data for AI model
    // Simplified feature extraction for this example
    const totalTransactions = history.length;
    const totalAmount = history.reduce((sum, t) => sum + (t.amount || 0), 0);
    const defaults = history.filter(t => t.type === "default").length;

    // 3. Call Google Cloud AI Platform (Vertex AI)
    // NOTE: This assumes you have a model deployed on Vertex AI.
    // Replace PROJECT_ID, LOCATION, and ENDPOINT_ID with actual values.
    const projectId = process.env.GCP_PROJECT_ID || "njangipay-e4e09";
    const location = "us-central1"; 
    const endpointId = "AI_RISK_MODEL_ENDPOINT"; // Placeholder for real endpoint

    let defaultRisk = 0.05; // Default fallback risk
    let aiRiskScore = 0.5;

    // Use Vertex AI client if configured, otherwise use a simulated calculation logic
    if (endpointId !== "AI_RISK_MODEL_ENDPOINT") {
        const endpoint = aiClient.endpointPath(projectId, location, endpointId);
        const [predictionResponse] = await aiClient.predict({
            endpoint,
            instances: [{
                totalTransactions,
                totalAmount,
                defaults,
                lastAmount: transactionData.amount
            }],
        });
        
        // Extract risk score from AI prediction
        aiRiskScore = predictionResponse.predictions[0].score || 0.5;
        defaultRisk = predictionResponse.predictions[0].defaultProb || 0.05;
    } else {
        // Fallback: Simplified AI logic for demonstration
        aiRiskScore = Math.max(0, 1 - (defaults * 0.2) - (totalTransactions * 0.01));
        defaultRisk = defaults > 0 ? 0.3 : 0.05;
        console.log("Using fallback AI logic for NjangiPay risk calculation.");
    }

    // 4. Update Member's risk score
    // We need to find the member record for this user in the specific group
    const memberSnapshot = await admin.firestore()
      .collection("members")
      .where("user_id", "==", userId)
      .where("group_id", "==", transactionData.group_id)
      .limit(1)
      .get();

    if (!memberSnapshot.empty) {
      const memberDoc = memberSnapshot.docs[0];
      await memberDoc.ref.update({
        aiRiskScore: parseFloat(aiRiskScore.toFixed(2)),
        defaultRisk: parseFloat(defaultRisk.toFixed(2)),
        lastAiAssessment: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Risk score updated for user ${userId} in group ${transactionData.group_id}`);
    } else {
      console.warn(`No member found for user ${userId} in group ${transactionData.group_id}`);
    }

  } catch (error) {
    console.error("Error calculating AI Risk Score:", error);
  }
});
