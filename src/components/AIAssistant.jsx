import React, { useState, useRef, useEffect } from 'react';
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

// Use the API key directly for local development if needed
const frontendApiKey = import.meta.env.VITE_AI_API_KEY;

const AIAssistant = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { role: 'assistant', text: "Hello! I'm your NjangiPay financial expert. How can I help you manage your savings, credits, or ROI strategies today?" }
  ]);
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isLoading]);

  // Lock body scroll when open on mobile
  React.useEffect(() => {
    if (isOpen && window.innerWidth <= 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await callGeminiAI(inputText);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (error) {
      console.error("AI Error:", error);
      const isRateLimited = error.message === 'RATE_LIMITED';
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: isRateLimited
          ? "⏳ Rate limit reached. Please wait 30–60 seconds and try again."
          : "I'm experiencing a temporary issue. Would you like to retry?",
        isRetryable: !isRateLimited,
        originalQuery: inputText
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (queryText) => {
    setIsLoading(true);
    setMessages(prev => prev.slice(0, -1));
    try {
      const response = await callGeminiAI(queryText);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Reconnection failed. Please check your network.",
        isRetryable: true,
        originalQuery: queryText
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const callGeminiAI = async (userQuery) => {
    try {
      // 1. Primary Method: Use your new Vercel Serverless Function (No Blaze Plan Required!)
      const res = await fetch('/api/getAiResponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery })
      });
      
      if (res.ok) {
        const data = await res.json();
        return data.text || "I was unable to process that. Could you rephrase?";
      }
      throw new Error(`API_ERROR_${res.status}`);
    } catch (error) {
      console.warn("Vercel API failed, trying direct frontend fallback:", error);
      
      // 2. Fallback: Direct frontend call (uses your VITE_AI_API_KEY)
      if (!frontendApiKey) {
        throw new Error("AI Backend unconfigured. Please check Vercel environment variables.");
      }

      const prompt = `Role: NjangiPay Expert. Concise (3 sentences). ${userQuery}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${frontendApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (res.status === 429) throw new Error('RATE_LIMITED');
      if (!res.ok) throw new Error(`API_ERROR_${res.status}`);

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Response unavailable. Try one more time?";
    }
  };

  // --- Styles ---
  const isMobile = () => window.innerWidth <= 640;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 998,
    display: isOpen ? 'block' : 'none',
    backdropFilter: 'blur(2px)',
  };

  const panelStyle = {
    position: 'fixed',
    zIndex: 999,
    // Mobile: full-width bottom sheet
    bottom: isOpen ? 0 : '-100%',
    left: 0,
    right: 0,
    height: '90dvh',
    maxWidth: '100%',
    borderRadius: '24px 24px 0 0',
    // Desktop override via CSS class
    transition: 'bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    overflow: 'hidden',
    background: 'var(--glass-bg, #1a1f2e)',
    border: '1px solid var(--primary-green, #27ae60)',
    boxShadow: '0 -8px 40px rgba(39,174,96,0.25)',
  };

  const desktopPanelStyle = {
    top: 'auto',
    left: 'auto',
    right: '24px',
    bottom: '88px',
    height: '560px',
    width: '380px',
    maxWidth: 'calc(100vw - 48px)',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div style={overlayStyle} onClick={() => setIsOpen(false)} />

      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label="Open AI Assistant"
        className="btn-primary"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          width: '60px',
          height: '60px',
          borderRadius: '18px',
          padding: 0,
          fontSize: '1.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 25px rgba(39,174,96,0.45)',
          border: '3px solid rgba(255,255,255,0.15)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: isOpen ? 'scale(0.92)' : 'scale(1)',
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat panel — mobile bottom sheet / desktop floating */}
      {isOpen && (
        <div
          className="ai-panel"
          style={{
            position: 'fixed',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--glass-bg, #1a1f2e)',
            border: '1px solid var(--primary-green, #27ae60)',
            overflow: 'hidden',
            // Mobile defaults (overridden by media query below)
            bottom: 0,
            left: 0,
            right: 0,
            height: '90dvh',
            maxHeight: '90dvh',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -8px 40px rgba(39,174,96,0.25)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}>
            {/* Drag handle (mobile hint) */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.2)',
            }} />
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '1rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🤖</span>
              Njangi AI
              <span style={{ fontSize: '0.65rem', background: 'var(--accent-light)', color: 'var(--primary-dark)', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>EXPERT</span>
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '8px' }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            WebkitOverflowScrolling: 'touch',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'var(--primary-green, #27ae60)' : 'rgba(255,255,255,0.07)',
                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                padding: '12px 15px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                maxWidth: '85%',
                fontSize: '0.875rem',
                lineHeight: '1.55',
                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                wordBreak: 'break-word',
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
                      fontWeight: 600,
                    }}
                  >↩ Retry</button>
                )}
              </div>
            ))}
            {isLoading && (
              <div style={{
                alignSelf: 'flex-start',
                background: 'rgba(255,255,255,0.07)',
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.875rem',
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
              }}>
                <span style={{ animation: 'pulse 1s infinite' }}>●</span>
                <span style={{ animation: 'pulse 1s infinite 0.2s' }}>●</span>
                <span style={{ animation: 'pulse 1s infinite 0.4s' }}>●</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.2)',
            flexShrink: 0,
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '14px',
              padding: '8px 8px 8px 16px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <input
                type="text"
                id="ai-query-input"
                name="ai-query-input"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Ask Njangi AI..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.9rem',
                  color: 'var(--text-main)',
                  minWidth: 0,
                }}
                autoFocus
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                style={{
                  background: inputText.trim() && !isLoading ? 'var(--primary-green, #27ae60)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '10px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '1.1rem',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                {isLoading ? '…' : '→'}
              </button>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: '0.5px' }}>
              ⚡ AI POWERED BY GEMINI (FREE SPARK PLAN)
            </p>
          </div>
        </div>
      )}

      {/* Responsive styles via style tag */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        /* Desktop: floating panel, not full-screen */
        @media (min-width: 641px) {
          .ai-panel {
            bottom: 88px !important;
            left: auto !important;
            right: 24px !important;
            width: 380px !important;
            height: 560px !important;
            max-height: 80vh !important;
            border-radius: 20px !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3) !important;
          }
        }
      `}</style>
    </>
  );
};

export default AIAssistant;
