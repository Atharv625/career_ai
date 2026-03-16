import { useNavigate } from "react-router-dom";
import { MessageSquare, Zap, BarChart2, Map, GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";

const FEATURES = [
  {
    icon: MessageSquare, label: "AI Career Advisor", color: "var(--signal)",
    desc: "Chat with Gemini AI for personalized career guidance and advice.",
    path: "/chat"
  },
  {
    icon: Zap, label: "Career Recommendations", color: "#A78BFA",
    desc: "Get matched to ideal careers based on your skills and interests.",
    path: "/recommend"
  },
  {
    icon: BarChart2, label: "Skill Gap Analysis", color: "#F472B6",
    desc: "See exactly which skills you need to land your dream role.",
    path: "/skill-gap"
  },
  {
    icon: Map, label: "Learning Roadmap", color: "#FB923C",
    desc: "Get a step-by-step personalized plan to reach your career goal.",
    path: "/roadmap"
  },
  {
    icon: GraduationCap, label: "Course Finder", color: "#38BDF8",
    desc: "Discover top-rated courses to fill your skill gaps fast.",
    path: "/courses"
  },
];

const EXAMPLE_QUESTIONS = [
  "What career should I choose after computer engineering?",
  "How to become a data scientist from scratch?",
  "What skills do I need as an AI engineer?",
  "Compare cloud vs ML engineering salaries",
  "Best certification for DevOps in 2025?",
];

export default function HomePage() {
  const navigate = useNavigate();
  const { profile } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fade-in">

      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          style={{ background: "rgba(79,255,176,0.08)", border: "1px solid rgba(79,255,176,0.15)" }}>
          <Sparkles size={12} style={{ color: "var(--signal)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--signal)" }}>
            Powered by Google Gemini AI
          </span>
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
          Your{" "}
          <span style={{ color: "var(--signal)" }} className="glow-text">
            One-Stop
          </span>
          {" "}Career<br />& Education Advisor
        </h1>

        <p className="text-lg max-w-xl mx-auto mb-8"
          style={{ color: "#8892A4", lineHeight: 1.7 }}>
          {profile.name ? `Welcome back, ${profile.name}! ` : ""}
          Discover your ideal career path, analyze skill gaps, get personalized
          learning roadmaps — all powered by AI.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button className="btn-primary flex items-center gap-2 text-sm"
            onClick={() => navigate("/chat")}>
            <MessageSquare size={16} />
            Chat with AI Advisor
          </button>
          <button className="btn-ghost flex items-center gap-2 text-sm"
            onClick={() => navigate("/recommend")}>
            Get Career Match
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {FEATURES.map(({ icon: Icon, label, color, desc, path }) => (
          <button key={label} onClick={() => navigate(path)}
            className="card text-left p-5 group transition-all duration-200 hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="font-semibold text-white text-sm mb-1">{label}</div>
            <div className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>{desc}</div>
            <div className="flex items-center gap-1 mt-3 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color }}>
              Open <ArrowRight size={11} />
            </div>
          </button>
        ))}
      </div>

      {/* Quick questions */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={15} style={{ color: "var(--signal)" }} />
          <span className="text-sm font-semibold text-white">Ask the AI Advisor</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map(q => (
            <button key={q}
              onClick={() => navigate("/chat", { state: { question: q } })}
              className="text-xs px-3 py-2 rounded-lg transition-all hover:-translate-y-0.5"
              style={{
                background: "var(--ink-700)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#8892A4"
              }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--signal)"}
              onMouseLeave={e => e.currentTarget.style.color = "#8892A4"}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
