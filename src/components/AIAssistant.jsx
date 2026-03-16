import React, { useState, useRef, useEffect } from 'react';
import { db } from '../config/firebase'; // For potential context fetching later

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your NjangiPay financial expert. How can I help you manage your savings, credits, or ROI strategies today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const apiKey = import.meta.env.VITE_AI_API_KEY;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    if (!apiKey) {
      setMessages(prev => [...prev, 
        { role: 'user', text: inputText },
        { role: 'assistant', text: "⚠️ System Neural Disconnect: AI services are currently unconfigured. Please contact platform support to enable Gemini intelligence." }
      ]);
      setInputText('');
      return;
    }

    const userMessage = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await callGeminiAI(inputText);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "I'm experiencing a temporary neural logout. Would you like me to attempt a reconnection?",
        isRetryable: true,
        originalQuery: inputText
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (queryText) => {
    setIsLoading(true);
    // Remove the error message that had the retry button
    setMessages(prev => prev.slice(0, -1));
    
    try {
      const response = await callGeminiAI(queryText);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "Neural reconnection failed. Please check your network and try again.",
        isRetryable: true,
        originalQuery: queryText
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const callGeminiAI = async (userQuery) => {
    const prompt = `
      You are the elite NjangiPay Financial AI Expert. 
      NjangiPay is a smart community savings and lending platform that digitizes the traditional West African "Njangi" or "Tontine" credit union model.
      
      User Goal: ${userQuery}
      
      Context guidelines (Even if you don't have the user's specific data yet, assume these are the features they are asking about):
      - We use AI for credit scoring based on community standing.
      - We offer a Marketplace for P2P loan funding and investments.
      - We have automated contribution tracking for group savings.
      - We focus on ROI strategies, cooperative economics, and building generational wealth.
      
      STRICT RULES:
      1. ALWAYS incline your answers towards finance, group savings, loans, and wealth building. If the user asks a general question, gently pivot the conversation back to how NjangiPay or financial planning can help them.
      2. Be professional, encouraging, and financially astute. 
      3. Keep responses concise (under 3 sentences unless explicitly asked for detail).
      4. Use strong financial terminology appropriate for P2P lending and cooperatives.
      5. Explicitly mention NjangiPay features (Marketplace, AI Credit Score, Group Savings) where relevant.
    `;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to process that. Could you rephrase?";
    } catch (err) {
      throw err;
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
      {isOpen ? (
        <div className="glass ai-chat-container" style={{ 
          width: '380px', 
          height: '550px', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '20px', 
          border: '1px solid var(--primary-green)', 
          boxShadow: 'var(--shadow-lg)', 
          borderRadius: '20px',
          background: 'var(--glass-bg)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <span style={{ fontSize: '1.2rem' }}>🤖</span> Njangi AI <span style={{ fontSize: '0.7rem', background: 'var(--accent-light)', color: 'var(--primary-dark)', padding: '2px 6px', borderRadius: '4px' }}>EXPERT</span>
            </h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
          </div>

          <div className="ai-messages-list" style={{ 
            flex: 1, 
            overflowY: 'auto', 
            background: 'var(--accent-light)', 
            borderRadius: '15px', 
            padding: '15px', 
            marginBottom: '15px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            border: '1px solid var(--glass-border)'
          }}>
            {messages.map((msg, i) => (
                <div key={i} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'var(--primary-green)' : 'var(--white)',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                maxWidth: '88%',
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-sm)',
                lineHeight: '1.5',
                border: msg.role === 'assistant' ? '1px solid var(--glass-border)' : 'none',
                position: 'relative'
              }}>
                {msg.text}
                {msg.isRetryable && (
                  <button 
                    onClick={() => handleRetry(msg.originalQuery)}
                    style={{ 
                      display: 'block', 
                      marginTop: '8px', 
                      background: 'var(--primary-green)', 
                      color: 'white', 
                      border: 'none', 
                      padding: '4px 12px', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Retry Connection
                  </button>
                )}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--white)', color: 'var(--text-main)', padding: '10px 14px', borderRadius: '15px 15px 15px 2px', fontSize: '0.9rem', border: '1px solid var(--glass-border)' }}>
                <span className="typing-indicator">Analyzing platform data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'var(--white)', padding: '8px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Query Njangi intelligence..."
              style={{ flex: 1, padding: '10px 15px', borderRadius: '10px', border: 'none', outline: 'none', fontSize: '0.9rem', background: 'transparent', color: 'var(--text-main)' }}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className="btn-primary" 
              style={{ padding: '0 12px', borderRadius: '12px', height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!inputText.trim() || isLoading) ? 0.6 : 1 }}
            >
              {isLoading ? '...' : '→'}
            </button>
          </div>
          
          <div style={{ marginTop: '10px', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.5px' }}>
            {apiKey ? '⚡ POWERED BY GEMINI 2.0 FLASH' : '⚠️ AI OFFLINE'}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="btn-primary glass ai-trigger"
          style={{ 
            width: '65px', 
            height: '65px', 
            borderRadius: '20px', 
            padding: 0, 
            fontSize: '2rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(39, 174, 96, 0.4)',
            border: '3px solid var(--white)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          🤖
        </button>
      )}
    </div>
  );
};

export default AIAssistant;
