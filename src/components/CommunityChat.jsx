import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Search, Send, User, MessageSquare } from 'lucide-react';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const CommunityChat = ({ groupId, theme }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!groupId) return;

    const q = query(
      collection(db, "messages"),
      where("groupId", "==", groupId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setLoading(false);
      scrollToBottom();
    }, (error) => {
      console.error("Chat listen error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: inputText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email.split('@')[0],
        groupId: groupId,
        timestamp: serverTimestamp()
      });
      setInputText('');
    } catch (error) {
      console.error("Send message error:", error);
      alert("Failed to send message.");
    }
  };

  return (
    <div className="glass chat-container" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--glass-bg)',
      borderRadius: '20px',
      overflow: 'hidden',
      border: '1px solid var(--glass-border)'
    }}>
      <div className="chat-header" style={{ 
        padding: '20px', 
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <MessageSquare size={20} color="var(--primary-green)" />
        <h3 style={{ margin: 0 }}>Community Chat</h3>
      </div>

      <div className="chat-messages" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {loading ? (
          <div className="flex-center" style={{ height: '100%' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
            No messages yet. <br /> Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              style={{ 
                alignSelf: msg.senderId === currentUser?.uid ? 'flex-end' : 'flex-start',
                maxWidth: '90%'
              }}
            >
              <div style={{ 
                fontSize: '0.7rem', 
                color: 'var(--text-muted)', 
                marginBottom: '2px',
                textAlign: msg.senderId === currentUser?.uid ? 'right' : 'left'
              }}>
                {msg.senderName}
              </div>
              <div style={{ 
                background: msg.senderId === currentUser?.uid ? 'var(--primary-green)' : 'var(--white)',
                color: msg.senderId === currentUser?.uid ? 'white' : 'var(--text-main)',
                padding: '8px 12px',
                borderRadius: msg.senderId === currentUser?.uid ? '15px 15px 2px 15px' : '15px 15px 15px 2px',
                boxShadow: 'var(--shadow-sm)',
                border: msg.senderId === currentUser?.uid ? 'none' : '1px solid var(--glass-border)',
                fontSize: '0.95rem',
                wordBreak: 'break-word'
              }}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={{ 
        padding: '15px', 
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        gap: '8px'
      }}>
        <label htmlFor="chat-message" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>Type a message</label>
        <input 
          type="text" 
          id="chat-message"
          name="message"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          style={{ 
            flex: 1, 
            padding: '12px 20px', 
            borderRadius: '12px', 
            border: '1px solid var(--glass-border)',
            background: 'var(--white)',
            color: 'var(--text-main)',
            outline: 'none'
          }}
        />
        <button 
          type="submit" 
          className="btn-primary" 
          style={{ width: '45px', height: '45px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          disabled={!inputText.trim()}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default CommunityChat;
