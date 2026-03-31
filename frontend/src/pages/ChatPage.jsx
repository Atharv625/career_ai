import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Send, RotateCcw, Sparkles, User, BookOpen, Zap } from "lucide-react";
import { useApp } from "../context/AppContext";
import { sendChatMessage, clearChatSession } from "../services/api";

const SUGGESTIONS = [
  "What career fits a Python + ML background?",
  "How do I become a cloud engineer?",
  "What skills are missing for a data scientist role?",
  "Create a 6-month learning plan for web dev",
  "Best certifications for cybersecurity?",
];

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
        isUser ? "" : ""
      }`}
        style={isUser
          ? { background: "rgba(167,139,250,0.2)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.3)" }
          : { background: "var(--signal-muted)", color: "var(--signal)", border: "1px solid rgba(79,255,176,0.2)" }
        }>
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>

      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? "rounded-tr-sm" : "rounded-tl-sm"
        }`}
          style={isUser
            ? { background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.2)", color: "#E8ECF4" }
            : { background: "var(--ink-800)", border: "1px solid rgba(79,255,176,0.1)", color: "#D1D5DB" }
          }
        >
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div className="prose-dark">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {msg.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-xs" style={{ color: "#4A5568" }}>Sources:</span>
            {msg.sources.map(s => (
              <span key={s} className="tag text-xs">{s}</span>
            ))}
          </div>
        )}

        <span className="text-xs px-1" style={{ color: "#374151" }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: "var(--signal-muted)", border: "1px solid rgba(79,255,176,0.2)" }}>
        <Sparkles size={14} style={{ color: "var(--signal)" }} />
      </div>
      <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2"
        style={{ background: "var(--ink-800)", border: "1px solid rgba(79,255,176,0.1)" }}>
        <div className="flex gap-1">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <span className="text-xs" style={{ color: "#4A5568" }}>Thinking…</span>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { userId, profile, chatMessages, setChatMessages } = useApp();
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const location  = useLocation();

  // Auto-send question passed via navigation state
  useEffect(() => {
    if (location.state?.question && !loading) {
      setInput(location.state.question);
      window.history.replaceState({}, "");
    }
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, loading]);

  const sendMessage = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await sendChatMessage(userId, trimmed, profile);
      const aiMsg = {
        role: "assistant",
        content: data.response,
        sources: data.sources || [],
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Sorry, I couldn't connect to the AI service. Please check your API key and backend connection.",
        sources: [],
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = async () => {
    setChatMessages([]);
    try { await clearChatSession(userId); } catch {}
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-4 border-b flex-shrink-0"
        style={{ borderColor: "rgba(79,255,176,0.07)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--signal-muted)", border: "1px solid rgba(79,255,176,0.2)" }}>
            <Sparkles size={16} style={{ color: "var(--signal)" }} />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">AI Career Advisor</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
                style={{ background: "var(--signal)" }} />
              <span className="text-xs" style={{ color: "var(--signal)" }}>Online · Gemini Powered</span>
            </div>
          </div>
        </div>
        {chatMessages.length > 0 && (
          <button onClick={handleClear}
            className="flex items-center gap-1.5 text-xs btn-ghost py-1.5 px-3">
            <RotateCcw size={12} /> New Chat
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-5">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 pt-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 animate-float"
              style={{ background: "var(--signal-muted)", border: "1px solid rgba(79,255,176,0.2)" }}>
              <Sparkles size={28} style={{ color: "var(--signal)" }} />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">
              How can I help you today?
            </h2>
            <p className="text-sm mb-8 max-w-sm" style={{ color: "#6B7280" }}>
              Ask me anything about careers, skills, learning paths, certifications, or job market trends.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(s => (
                <button key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs p-3 rounded-xl transition-all hover:-translate-y-0.5"
                  style={{
                    background: "var(--ink-800)",
                    border: "1px solid rgba(79,255,176,0.08)",
                    color: "#9CA3AF"
                  }}>
                  <Zap size={10} style={{ color: "var(--signal)", display: "inline", marginRight: 6 }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="py-4 flex-shrink-0">
        <div className="flex gap-2 items-end rounded-2xl p-2"
          style={{ background: "var(--ink-800)", border: "1px solid rgba(79,255,176,0.15)" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask about careers, skills, or learning paths…"
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-2 px-2 leading-relaxed"
            style={{
              color: "#E8ECF4", fontFamily: "'DM Sans', sans-serif",
              maxHeight: "120px", minHeight: "36px"
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary p-2.5 rounded-xl flex-shrink-0"
            style={{ padding: "10px" }}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: "#374151" }}>
          AI responses are for guidance only. Verify details independently.
        </p>
      </div>
    </div>
  );
}
