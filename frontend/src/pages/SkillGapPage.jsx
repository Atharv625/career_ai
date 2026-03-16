import { useState } from "react";
import { BarChart2, CheckCircle, XCircle, AlertCircle, Clock, RefreshCw, ChevronDown } from "lucide-react";
import { analyzeSkillGap } from "../services/api";
import { useApp } from "../context/AppContext";
import SkillInput from "../components/skills/SkillInput";

const CAREERS = [
  "AI/ML Engineer", "Full Stack Developer", "Cloud/DevOps Engineer",
  "Data Scientist", "Cybersecurity Engineer", "Blockchain Developer",
  "UX/UI Designer", "Product Manager"
];

const READINESS_COLOR = {
  "Ready": "var(--signal)",
  "Almost Ready": "#A3E635",
  "Developing": "#FCD34D",
  "Beginner": "#FB923C",
  "Just Starting": "#F87171",
};

function SkillPill({ skill, type }) {
  const styles = {
    matched:  { bg: "rgba(79,255,176,0.1)",   color: "var(--signal)",  icon: <CheckCircle size={11} /> },
    missing:  { bg: "rgba(248,113,113,0.1)",   color: "#F87171",        icon: <XCircle size={11} /> },
    priority: { bg: "rgba(251,146,60,0.1)",    color: "#FB923C",        icon: <AlertCircle size={11} /> },
    nice:     { bg: "rgba(156,163,175,0.08)",  color: "#9CA3AF",        icon: null },
  };
  const s = styles[type] || styles.nice;
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
      {s.icon}{skill}
    </span>
  );
}

export default function SkillGapPage() {
  const { profile } = useApp();
  const [skills, setSkills]       = useState(profile.skills || []);
  const [career, setCareer]       = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const run = async () => {
    if (!career) { setError("Select a target career."); return; }
    if (skills.length === 0) { setError("Add at least one skill."); return; }
    setError(""); setLoading(true);
    try {
      const data = await analyzeSkillGap(skills, career);
      setResult(data);
    } catch {
      setError("Failed to analyze. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const matchPct = result ? parseInt(result.match_percentage) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Skill Gap Analyzer</h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          Find exactly which skills you're missing for your target career.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_1.6fr] gap-6">
        {/* Inputs */}
        <div className="space-y-5">
          <div className="card p-5">
            <label className="text-xs font-semibold mb-3 block" style={{ color: "#9CA3AF" }}>YOUR SKILLS</label>
            <SkillInput skills={skills} setSkills={setSkills} />
          </div>

          <div className="card p-5">
            <label className="text-xs font-semibold mb-3 block" style={{ color: "#9CA3AF" }}>TARGET CAREER</label>
            <div className="relative">
              <select
                value={career}
                onChange={e => setCareer(e.target.value)}
                className="input-dark appearance-none pr-8"
                style={{ cursor: "pointer" }}
              >
                <option value="">Select a career…</option>
                {CAREERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#4A5568" }} />
            </div>
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg"
              style={{ background: "rgba(248,113,113,0.1)", color: "#F87171" }}>
              {error}
            </p>
          )}
          <button onClick={run} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><RefreshCw size={14} className="animate-spin" /> Analyzing…</> : <><BarChart2 size={14} /> Analyze Gap</>}
          </button>
        </div>

        {/* Results */}
        <div>
          {result === null ? (
            <div className="card h-full flex flex-col items-center justify-center py-20 text-center">
              <BarChart2 size={40} style={{ color: "var(--signal)", opacity: 0.3 }} className="mb-4" />
              <p className="text-sm font-medium text-white mb-1">No analysis yet</p>
              <p className="text-xs" style={{ color: "#4A5568" }}>
                Add your skills, pick a target career, then click Analyze
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Summary card */}
              <div className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-white">{result.career_name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${READINESS_COLOR[result.readiness_level]}18`, color: READINESS_COLOR[result.readiness_level] }}>
                      {result.readiness_level}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: READINESS_COLOR[result.readiness_level] || "var(--signal)" }}>
                      {result.match_percentage}
                    </div>
                    <div className="text-xs" style={{ color: "#4A5568" }}>match</div>
                  </div>
                </div>
                <div className="progress-bar mb-3">
                  <div className="progress-fill" style={{
                    width: result.match_percentage,
                    background: `linear-gradient(90deg, ${READINESS_COLOR[result.readiness_level] || "var(--signal-dim)"}, ${READINESS_COLOR[result.readiness_level] || "var(--signal)"})`
                  }} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-2 rounded-lg" style={{ background: "var(--ink-700)" }}>
                    <div className="font-bold text-white text-base">{result.skill_counts.total_required}</div>
                    <div style={{ color: "#6B7280" }}>Required</div>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: "rgba(79,255,176,0.06)" }}>
                    <div className="font-bold text-base" style={{ color: "var(--signal)" }}>{result.skill_counts.matched}</div>
                    <div style={{ color: "#6B7280" }}>You Have</div>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: "rgba(248,113,113,0.06)" }}>
                    <div className="font-bold text-base" style={{ color: "#F87171" }}>{result.skill_counts.missing}</div>
                    <div style={{ color: "#6B7280" }}>Missing</div>
                  </div>
                </div>
              </div>

              {/* Time estimate */}
              {result.estimated_learning_months > 0 && (
                <div className="card p-4 flex items-center gap-3">
                  <Clock size={18} style={{ color: "#FCD34D" }} />
                  <div>
                    <span className="text-white font-semibold text-sm">
                      ~{result.estimated_learning_months} months
                    </span>
                    <span className="text-xs ml-2" style={{ color: "#6B7280" }}>
                      estimated learning time ({result.estimated_learning_weeks} weeks)
                    </span>
                  </div>
                </div>
              )}

              {/* Skills breakdown */}
              {result.matched_skills?.length > 0 && (
                <div className="card p-4">
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--signal)" }}>
                    ✓ Skills You Already Have ({result.matched_skills.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched_skills.map(s => <SkillPill key={s} skill={s} type="matched" />)}
                  </div>
                </div>
              )}

              {result.priority_missing?.length > 0 && (
                <div className="card p-4">
                  <div className="text-xs font-semibold mb-2" style={{ color: "#FB923C" }}>
                    ⚡ Priority Skills to Learn ({result.priority_missing.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.priority_missing.map(s => <SkillPill key={s} skill={s} type="priority" />)}
                  </div>
                </div>
              )}

              {result.secondary_missing?.length > 0 && (
                <div className="card p-4">
                  <div className="text-xs font-semibold mb-2" style={{ color: "#F87171" }}>
                    ✗ Other Missing Skills ({result.secondary_missing.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.secondary_missing.map(s => <SkillPill key={s} skill={s} type="missing" />)}
                  </div>
                </div>
              )}

              {result.nice_to_have_missing?.length > 0 && (
                <div className="card p-4">
                  <div className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>
                    ○ Nice-to-Have Skills
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.nice_to_have_missing.map(s => <SkillPill key={s} skill={s} type="nice" />)}
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
