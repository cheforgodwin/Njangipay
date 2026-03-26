const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { PredictionServiceClient } = require("@google-cloud/aiplatform");
const axios = require("axios");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// Initialize the AI Platform Prediction Service Client
const aiClient = new PredictionServiceClient();

/**
 * Cloud Function to get AI response for the chat assistant.
 * Using onCall for modern Firebase Function integration.
 */
exports.getAiResponse = onCall({ maxInstances: 10 }, async (request) => {
  try {
    // 1. Validate request
    const userQuery = request.data?.query;
    if (!userQuery) {
      return { error: "No query provided." };
    }

    // 2. Fetch API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_AI_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY is missing.");
      return { error: "AI Backend unconfigured." };
    }

    const prompt = `You are the NjangiPay Financial AI Expert. User Query: ${userQuery}. (Keep it concise, under 3 sentences).`;

    // 3. API Call
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
    );

    const aiText = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return { text: aiText || "I couldn't generate a response." };

  } catch (error) {
    console.error("Function Error:", error.message);
    return { 
      error: "The AI is momentarily unavailable.",
      details: error.message 
    };
  }
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
    let aiReason = "Standard profile analysis";
    let aiTrustLevel = "Standard";

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
        // Use Gemini API for advanced risk pattern analysis as a powerful secondary model
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_AI_API_KEY;
        if (apiKey) {
            try {
                const historySummary = history.map(t => `${t.type}: ${t.amount} XAF (${t.status}) on ${t.timestamp?.toDate ? t.timestamp.toDate().toDateString() : 'N/A'}`).join(", ");
                const riskPrompt = `Analyze this transaction history for NjangiPay (community savings platform). 
                Borrower History: ${historySummary}.
                Evaluate:
                1. Savings Consistency: Do they contribute regularly?
                2. Volume vs Frequency: High volume with low frequency is riskier than steady small amounts.
                3. Repayment history: Check for defaults or delays.
                Output ONLY a valid JSON object: {"score": 0.0-1.0, "reason": "concise explanation", "trustLevel": "Trusted|Standard|Monitoring"}.
                Score: 1.0 (Safe), 0.0 (High Risk). Reason must be under 15 words.`;

                const geminiRes = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                    { contents: [{ parts: [{ text: riskPrompt }] }] },
                    { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
                );

                const aiResponse = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
                // Robust JSON parsing
                const jsonMatch = aiResponse.match(/\{.*\}/s);
                const aiData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
                
                aiRiskScore = aiData.score || 0.5;
                defaultRisk = 1 - aiRiskScore;
                aiReason = aiData.reason || "AI assessment completed.";
                aiTrustLevel = aiData.trustLevel || "Standard";
                console.log(`Gemini AI Risk Assessment: ${aiRiskScore} (${aiTrustLevel}) - ${aiReason}`);
            } catch (err) {
                console.error("Gemini Risk Analysis failed, using fallback logic.");
                aiRiskScore = Math.max(0, 1 - (defaults * 0.2) - (totalTransactions * 0.01));
                defaultRisk = defaults > 0 ? 0.3 : 0.05;
            }
        } else {
            // Basic fallback logic
            aiRiskScore = Math.max(0, 1 - (defaults * 0.2) - (totalTransactions * 0.01));
            defaultRisk = defaults > 0 ? 0.3 : 0.05;
            console.log("Using basic fallback AI logic for NjangiPay risk calculation.");
        }
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
        aiRiskReason: aiReason || "Calculated via transaction patterns",
        trustLevel: aiTrustLevel || "Standard",
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
