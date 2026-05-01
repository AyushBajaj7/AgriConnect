import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SUGGESTED_QUESTIONS,
  sendChatMessage,
} from "../../services/chatService";
import "./Chatbot.css";

function createMessageId() {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createWelcomeMessage() {
  return {
    id: createMessageId(),
    role: "model",
    text: "AgriBot is ready. Ask about crop planning, government schemes, market prices, weather impact, or farm equipment.",
    timestamp: new Date(),
  };
}

function renderText(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? <strong key={index}>{part}</strong> : part,
  );
}

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => [createWelcomeMessage()]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTypingRef.current) {
      return;
    }

    isTypingRef.current = true;
    setIsTyping(true);

    const userMessage = {
      id: createMessageId(),
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((previousMessages) => [...previousMessages, userMessage]);
    setInputText("");

    try {
      const reply = await sendChatMessage(trimmed);
      const modelMessage = {
        id: createMessageId(),
        role: "model",
        text: reply,
        timestamp: new Date(),
      };

      setMessages((previousMessages) => [...previousMessages, modelMessage]);
    } catch {
      const fallbackMessage = {
        id: createMessageId(),
        role: "model",
        text: "AgriBot could not respond right now. Please try again.",
        timestamp: new Date(),
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        fallbackMessage,
      ]);
    } finally {
      isTypingRef.current = false;
      setIsTyping(false);
    }
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(inputText);
    }
  };

  const formatTime = (date) =>
    date?.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }) ?? "";

  const showSuggestions = messages.length === 1;

  return (
    <>
      <button
        className={`chatbot-trigger${isOpen ? " open" : ""}`}
        onClick={() => setIsOpen((previousValue) => !previousValue)}
        aria-label={isOpen ? "Close chat" : "Open AgriBot chat"}
        aria-expanded={isOpen}
      >
        {isOpen ? "x" : "AI"}
      </button>

      {isOpen && (
        <div className="chatbot-window" role="dialog" aria-label="AgriBot chat">
          <div className="chatbot-header">
            <div className="chatbot-header-brand">
              <span className="chatbot-brand-badge">✨</span>
              <div>
                <div className="chatbot-name">AgriBot</div>
                <div className="chatbot-status">
                  Powered by Gemini AI
                </div>
              </div>
            </div>
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              x
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-bubble chatbot-bubble-${message.role}`}
              >
                {message.role === "model" && (
                  <div className="chatbot-avatar">AI</div>
                )}
                <div className="chatbot-bubble-inner">
                  <div className="chatbot-bubble-text">
                    {message.text.split("\n").map((line, index, lines) => (
                      <React.Fragment key={index}>
                        {renderText(line)}
                        {index < lines.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="chatbot-bubble-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chatbot-bubble chatbot-bubble-model">
                <div className="chatbot-avatar">AI</div>
                <div className="chatbot-typing" aria-label="AgriBot is typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {showSuggestions && !isTyping && (
              <div className="chatbot-suggestions">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    className="chatbot-suggestion-chip"
                    onClick={() => sendMessage(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="chatbot-input-area">
            <textarea
              ref={inputRef}
              className="chatbot-input"
              id="chatbot-input"
              name="chatbot-input"
              placeholder="Ask about crops, schemes, prices…"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
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
              >
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
