import { useState } from "react";
import { Map, CheckCircle, Circle, Clock, BookOpen, Star, ChevronDown, RefreshCw, ArrowRight } from "lucide-react";
import { getRoadmap } from "../services/api";
import { useApp } from "../context/AppContext";
import SkillInput from "../components/skills/SkillInput";

const CAREERS = [
  "AI/ML Engineer", "Full Stack Developer", "Cloud/DevOps Engineer",
  "Data Scientist", "Cybersecurity Engineer", "Blockchain Developer",
  "UX/UI Designer", "Product Manager"
];

const STATUS_STYLE = {
  completed:    { color: "var(--signal)", bg: "rgba(79,255,176,0.1)",   icon: <CheckCircle size={14} /> },
  in_progress:  { color: "#A78BFA",       bg: "rgba(167,139,250,0.12)", icon: <Circle size={14} /> },
  upcoming:     { color: "#4A5568",        bg: "rgba(255,255,255,0.04)", icon: <Circle size={14} /> },
};

function RoadmapStep({ step, isLast }) {
  const [open, setOpen] = useState(step.status !== "upcoming");
  const style = STATUS_STYLE[step.status] || STATUS_STYLE.upcoming;

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-px"
          style={{ background: step.status === "completed" ? "rgba(79,255,176,0.3)" : "rgba(255,255,255,0.06)" }} />
      )}

      <div className="flex gap-4">
        {/* Step indicator */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold z-10"
          style={{ background: style.bg, color: style.color, border: `1.5px solid ${style.color}40` }}>
          {step.step}
        </div>

        {/* Content */}
        <div className="flex-1 pb-6">
          <button onClick={() => setOpen(!open)}
            className="flex items-center justify-between w-full text-left group">
            <div>
              <span className="font-semibold text-sm" style={{ color: step.status === "completed" ? "var(--signal)" : "#E8ECF4" }}>
                {step.phase}
              </span>
              {step.status === "completed" && (
                <span className="ml-2 text-xs" style={{ color: "var(--signal)", opacity: 0.7 }}>✓ Complete</span>
              )}
              {step.status === "in_progress" && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(167,139,250,0.15)", color: "#A78BFA" }}>
                  In Progress
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {step.estimated_weeks > 0 && (
                <span className="text-xs flex items-center gap-1" style={{ color: "#4A5568" }}>
                  <Clock size={11} /> {step.estimated_weeks}w
                </span>
              )}
              <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`}
                style={{ color: "#4A5568" }} />
            </div>
          </button>

          {open && (
            <div className="mt-2 space-y-3 animate-fade-in">
              {/* Skills */}
              {step.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.skills.map(s => {
                    const isKnown = step.known_skills?.includes(s);
                    return (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                        style={isKnown
                          ? { background: "rgba(79,255,176,0.1)", color: "var(--signal)", border: "1px solid rgba(79,255,176,0.2)" }
                          : { background: "var(--ink-700)", color: "#9CA3AF", border: "1px solid rgba(255,255,255,0.05)" }
                        }>
                        {isKnown ? "✓ " : ""}{s}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Description */}
              {step.description && (
                <p className="text-xs" style={{ color: "#6B7280" }}>{step.description}</p>
              )}

              {/* Recommended courses */}
              {step.courses?.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1.5" style={{ color: "#9CA3AF" }}>
                    📚 Recommended Courses
                  </div>
                  <div className="space-y-1.5">
                    {step.courses.map(c => (
                      <a key={c.name} href={c.url || "#"} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg transition-colors group"
                        style={{ background: "var(--ink-700)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--ink-600)"}
                        onMouseLeave={e => e.currentTarget.style.background = "var(--ink-700)"}
                      >
                        <BookOpen size={11} style={{ color: "#38BDF8", flexShrink: 0 }} />
                        <span className="text-xs text-white truncate">{c.name}</span>
                        <span className="text-xs ml-auto" style={{ color: "#4A5568" }}>{c.platform}</span>
                        <div className="flex items-center gap-0.5 ml-1">
                          <Star size={9} style={{ color: "#FCD34D" }} />
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>{c.rating}</span>
                        </div>
                        <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "var(--signal)", flexShrink: 0 }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const { profile } = useApp();
  const [skills, setSkills]     = useState(profile.skills || []);
  const [career, setCareer]     = useState("");
  const [goal, setGoal]         = useState("");
  const [roadmap, setRoadmap]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const run = async () => {
    if (!career) { setError("Select a target career."); return; }
    setError(""); setLoading(true);
    try {
      const data = await getRoadmap(career, skills, goal);
      setRoadmap(data);
    } catch {
      setError("Failed to generate roadmap. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Learning Roadmap</h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          Get a personalized, step-by-step learning plan tailored to your current skills.
        </p>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Config panel */}
        <div className="space-y-4">
          <div className="card p-4">
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#9CA3AF" }}>TARGET CAREER</label>
            <div className="relative">
              <select value={career} onChange={e => setCareer(e.target.value)} className="input-dark appearance-none pr-8" style={{ cursor: "pointer" }}>
                <option value="">Select career…</option>
                {CAREERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4A5568" }} />
            </div>
          </div>

          <div className="card p-4">
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#9CA3AF" }}>YOUR CURRENT SKILLS</label>
            <SkillInput skills={skills} setSkills={setSkills} />
          </div>

          <div className="card p-4">
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#9CA3AF" }}>YOUR GOAL (optional)</label>
            <input
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g. Get a job at a startup"
              className="input-dark"
            />
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#F87171" }}>
              {error}
            </p>
          )}

          <button onClick={run} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><RefreshCw size={14} className="animate-spin" /> Building…</> : <><Map size={14} /> Generate Roadmap</>}
          </button>
        </div>

        {/* Roadmap */}
        <div>
          {roadmap === null ? (
            <div className="card h-full flex flex-col items-center justify-center py-20 text-center">
              <Map size={40} style={{ color: "var(--signal)", opacity: 0.3 }} className="mb-4" />
              <p className="text-sm font-medium text-white mb-1">No roadmap yet</p>
              <p className="text-xs" style={{ color: "#4A5568" }}>Select a career and generate your personalized plan</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Summary */}
              <div className="card p-5">
                <h2 className="font-display text-xl font-bold text-white mb-1">{roadmap.user_goal}</h2>
                <p className="text-xs mb-4" style={{ color: "#6B7280" }}>{roadmap.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  {[
                    { label: "Phases", val: roadmap.total_phases, color: "#A78BFA" },
                    { label: "Months", val: roadmap.estimated_total_months, color: "#38BDF8" },
                    { label: "Match", val: roadmap.match_percentage, color: "var(--signal)" },
                    { label: "Readiness", val: roadmap.readiness_level, color: "#FCD34D" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="p-2.5 rounded-lg" style={{ background: "var(--ink-700)" }}>
                      <div className="font-bold text-sm" style={{ color }}>{val}</div>
                      <div style={{ color: "#6B7280" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div className="card p-5">
                {roadmap.steps?.map((step, i) => (
                  <RoadmapStep key={step.step} step={step} isLast={i === roadmap.steps.length - 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
