import { useState } from "react";
import { Zap, TrendingUp, DollarSign, Target, ChevronRight, RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";
import { getCareerRecommendations } from "../services/api";
import SkillInput from "../components/skills/SkillInput";

const INTERESTS_OPTIONS = [
  "programming", "data", "design", "security", "cloud",
  "management", "web", "mobile", "finance", "mathematics",
  "blockchain", "research", "entrepreneurship", "creativity"
];

const EDUCATION_OPTIONS = [
  { value: "high school", label: "High School" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelor", label: "Bachelor's" },
  { value: "master", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "self-taught", label: "Self-Taught" },
];

const OUTLOOK_COLOR = {
  "Very High": "var(--signal)",
  "High": "#A3E635",
  "Medium": "#FCD34D",
  "Low": "#F87171",
};

function CareerCard({ rec, rank }) {
  const [expanded, setExpanded] = useState(false);
  const scorePercent = Math.round(rec.score * 100);
  const salaryMin = rec.salary_range?.min;
  const salaryMax = rec.salary_range?.max;

  return (
    <div className="card p-5 animate-slide-up" style={{ animationDelay: `${rank * 0.08}s` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-display font-bold text-sm"
            style={{ background: "var(--ink-700)", color: "var(--signal)" }}>
            #{rank + 1}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{rec.career_name}</h3>
            <span className="text-xs" style={{ color: "#6B7280" }}>{rec.category}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold" style={{ color: "var(--signal)" }}>{scorePercent}%</div>
          <div className="text-xs" style={{ color: "#4A5568" }}>match</div>
        </div>
      </div>

      {/* Score bar */}
      <div className="progress-bar mb-4">
        <div className="progress-fill" style={{ width: `${scorePercent}%` }} />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: "rgba(79,255,176,0.08)", color: "var(--signal)" }}>
          Skills: {rec.skill_match}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: "rgba(167,139,250,0.08)", color: "#A78BFA" }}>
          Interest: {rec.interest_alignment}
        </span>
        {rec.growth_outlook && (
          <span className="text-xs px-2.5 py-1 rounded-full"
            style={{
              background: `${OUTLOOK_COLOR[rec.growth_outlook] || "#888"}18`,
              color: OUTLOOK_COLOR[rec.growth_outlook] || "#888"
            }}>
            📈 {rec.growth_outlook} Growth
          </span>
        )}
      </div>

      {/* Salary */}
      {salaryMin && (
        <div className="flex items-center gap-1.5 mb-3 text-xs" style={{ color: "#9CA3AF" }}>
          <DollarSign size={12} style={{ color: "#FCD34D" }} />
          ${salaryMin.toLocaleString()} – ${salaryMax.toLocaleString()}/yr
        </div>
      )}

      {/* Expand/collapse */}
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs font-medium"
        style={{ color: "#4A5568" }}>
        <ChevronRight size={13} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
        {expanded ? "Show less" : "View skills & roles"}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-3 animate-fade-in"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {rec.matched_skills?.length > 0 && (
            <div>
              <div className="text-xs mb-1.5 font-medium" style={{ color: "var(--signal)" }}>
                ✓ Skills you have
              </div>
              <div className="flex flex-wrap gap-1">
                {rec.matched_skills.map(s => (
                  <span key={s} className="tag">{s}</span>
                ))}
              </div>
            </div>
          )}
          {rec.missing_skills?.length > 0 && (
            <div>
              <div className="text-xs mb-1.5 font-medium" style={{ color: "#F87171" }}>
                ✗ Skills to learn
              </div>
              <div className="flex flex-wrap gap-1">
                {rec.missing_skills.map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(248,113,113,0.1)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {rec.job_roles?.length > 0 && (
            <div>
              <div className="text-xs mb-1.5 font-medium" style={{ color: "#9CA3AF" }}>Job Roles</div>
              <div className="text-xs" style={{ color: "#6B7280" }}>
                {rec.job_roles.join(" · ")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  const { profile } = useApp();
  const [skills, setSkills]         = useState(profile.skills || []);
  const [interests, setInterests]   = useState(profile.interests || []);
  const [education, setEducation]   = useState(profile.education || "bachelor");
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const toggleInterest = (i) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const run = async () => {
    if (skills.length === 0 && interests.length === 0) {
      setError("Add at least one skill or interest to get recommendations.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await getCareerRecommendations({ skills, interests, education, top_k: 6 });
      setResults(data.recommendations);
    } catch {
      setError("Failed to fetch recommendations. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Career Recommendations</h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          Tell us about your skills and interests to find your best-fit careers.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_1.4fr] gap-6">
        {/* Left: inputs */}
        <div className="space-y-5">
          <div className="card p-5">
            <label className="text-xs font-semibold mb-3 block" style={{ color: "#9CA3AF" }}>
              YOUR SKILLS
            </label>
            <SkillInput skills={skills} setSkills={setSkills} />
          </div>

          <div className="card p-5">
            <label className="text-xs font-semibold mb-3 block" style={{ color: "#9CA3AF" }}>
              YOUR INTERESTS
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS_OPTIONS.map(i => (
                <button key={i}
                  onClick={() => toggleInterest(i)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all capitalize ${
                    interests.includes(i) ? "card-active" : ""
                  }`}
                  style={interests.includes(i)
                    ? { background: "var(--signal-muted)", color: "var(--signal)", border: "1px solid rgba(79,255,176,0.3)" }
                    : { background: "var(--ink-700)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.05)" }
                  }>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <label className="text-xs font-semibold mb-3 block" style={{ color: "#9CA3AF" }}>
              EDUCATION LEVEL
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EDUCATION_OPTIONS.map(o => (
                <button key={o.value}
                  onClick={() => setEducation(o.value)}
                  className="text-xs py-2 px-3 rounded-lg transition-all text-left"
                  style={education === o.value
                    ? { background: "var(--signal-muted)", color: "var(--signal)", border: "1px solid rgba(79,255,176,0.3)" }
                    : { background: "var(--ink-700)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.05)" }
                  }>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg"
              style={{ background: "rgba(248,113,113,0.1)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}>
              {error}
            </p>
          )}

          <button onClick={run} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? (
              <><RefreshCw size={14} className="animate-spin" /> Analyzing…</>
            ) : (
              <><Zap size={14} /> Get Recommendations</>
            )}
          </button>
        </div>

        {/* Right: results */}
        <div>
          {results === null ? (
            <div className="card h-full flex flex-col items-center justify-center py-20 text-center">
              <Target size={40} style={{ color: "var(--signal)", opacity: 0.3 }} className="mb-4" />
              <p className="text-sm font-medium text-white mb-1">Ready to find your match</p>
              <p className="text-xs" style={{ color: "#4A5568" }}>
                Fill in your skills and interests, then click Get Recommendations
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm" style={{ color: "#6B7280" }}>No matches found. Try adding more skills.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} style={{ color: "var(--signal)" }} />
                <span className="text-sm font-semibold text-white">{results.length} Career Matches</span>
              </div>
              {results.map((rec, i) => (
                <CareerCard key={rec.career_name} rec={rec} rank={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
