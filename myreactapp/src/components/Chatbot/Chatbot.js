/**
 * File: Chatbot.js
 * Description: Floating AI chatbot backed by the AgriConnect Express backend.
 *              The backend retrieves relevant knowledge (RAG) then calls Gemini
 *              2.0 Flash to generate context-aware agricultural responses.
 * State:
 *   isOpen     — chat window visibility
 *   messages   — array of { id, role, text, timestamp }
 *   inputText  — controlled textarea value
 *   isTyping   — shows typing indicator while awaiting response
 * Used in: App.js (AppLayout)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendChatMessage, SUGGESTED_QUESTIONS } from '../../services/chatService';
import './Chatbot.css';

/** Generates a guaranteed-unique message ID that survives hot-reloads. */
const makeId = () => crypto.randomUUID();

const WELCOME_MSG = {
  id: makeId(),
  role: 'model',
  text: '🌾 Namaste! I\'m **AgriBot**, your agricultural assistant.\n\nI can help you with crop advice, government schemes, market prices, weather impact, farming tools, and much more. What would you like to know?',
  timestamp: new Date(),
};

/** Converts **bold** markdown to <strong> for simple inline rendering. */
function renderText(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

function Chatbot() {
  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState([WELCOME_MSG]);
  const [inputText, setInputText] = useState('');
  const [isTyping,  setIsTyping]  = useState(false);
  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  // Ref-based guard prevents two rapid sends from both slipping past the
  // isTyping state check before React flushes the state update.
  const isTypingRef  = useRef(false);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    // Use ref as the primary gate — immune to stale closure
    if (!trimmed || isTypingRef.current) return;

    isTypingRef.current = true;
    setIsTyping(true);

    const userMsg = { id: makeId(), role: 'user', text: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Build history (exclude welcome msg, last 20 messages)
    const history = messages
      .filter(m => m.id !== WELCOME_MSG.id)
      .slice(-20)
      .map(m => ({ role: m.role, text: m.text }));

    const reply = await sendChatMessage(history, trimmed);

    const botMsg = { id: makeId(), role: 'model', text: reply, timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
    isTypingRef.current = false;
    setIsTyping(false);
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const formatTime = (date) =>
    date?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) ?? '';

  const showSuggestions = messages.length <= 1;

  return (
    <>
      {/* Floating trigger button */}
      <button
        className={`chatbot-trigger${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open AgriBot chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="chatbot-window" role="dialog" aria-label="AgriBot chat">

          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-brand">
              <span>🌾</span>
              <div>
                <div className="chatbot-name">AgriBot</div>
                <div className="chatbot-status">● Online · Powered by Gemini AI</div>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Close">✕</button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chatbot-bubble chatbot-bubble-${msg.role}`}>
                {msg.role === 'model' && <div className="chatbot-avatar">🌾</div>}
                <div className="chatbot-bubble-inner">
                  <div className="chatbot-bubble-text">
                    {/* Pre-split once to avoid calling split() twice per line */}
                    {msg.text.split('\n').map((line, i, arr) => (
                      <React.Fragment key={i}>
                        {renderText(line)}{i < arr.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="chatbot-bubble-time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="chatbot-bubble chatbot-bubble-model">
                <div className="chatbot-avatar">🌾</div>
                <div className="chatbot-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {/* Suggested questions (shown only at start) */}
            {showSuggestions && !isTyping && (
              <div className="chatbot-suggestions">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button key={q} className="chatbot-suggestion-chip" onClick={() => sendMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="chatbot-input-area">
            <textarea
              ref={inputRef}
              className="chatbot-input"
              placeholder="Ask about crops, schemes, prices…"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isTyping}
              aria-label="Chat input"
            />
            <button
              className="chatbot-send"
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>

        </div>
      )}
    </>
  );
}

export default Chatbot;
