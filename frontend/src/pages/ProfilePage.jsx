import { useState } from "react";
import { User, Save, CheckCircle, ChevronDown } from "lucide-react";
import { useApp } from "../context/AppContext";
import SkillInput from "../components/skills/SkillInput";

const EDUCATION_OPTIONS = [
  { value: "high school", label: "High School" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "phd", label: "PhD" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "self-taught", label: "Self-Taught" },
];

const INTEREST_OPTIONS = [
  "programming", "data", "design", "security", "cloud",
  "management", "web", "mobile", "finance", "mathematics",
  "blockchain", "research", "entrepreneurship", "creativity"
];

const CAREER_GOALS = [
  "AI/ML Engineer", "Full Stack Developer", "Cloud/DevOps Engineer",
  "Data Scientist", "Cybersecurity Engineer", "Blockchain Developer",
  "UX/UI Designer", "Product Manager", "Exploring options"
];

export default function ProfilePage() {
  const { profile, updateProfile } = useApp();
  const [form, setForm]       = useState({ ...profile });
  const [saved, setSaved]     = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleInterest = (i) => {
    const cur = form.interests || [];
    set("interests", cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i]);
  };

  const handleSave = () => {
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">My Profile</h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          Your profile helps personalize all recommendations and AI responses.
        </p>
      </div>

      <div className="space-y-5">
        {/* Basic info */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={14} style={{ color: "var(--signal)" }} />
            <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>BASIC INFO</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#6B7280" }}>Full Name</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Your name" className="input-dark" />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#6B7280" }}>Email</label>
              <input value={form.email} onChange={e => set("email", e.target.value)}
                type="email" placeholder="you@example.com" className="input-dark" />
            </div>
          </div>
        </div>

        {/* Education & Goal */}
        <div className="card p-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#6B7280" }}>Education Level</label>
              <div className="relative">
                <select value={form.education} onChange={e => set("education", e.target.value)}
                  className="input-dark appearance-none pr-8">
                  {EDUCATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4A5568" }} />
              </div>
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#6B7280" }}>Career Goal</label>
              <div className="relative">
                <select value={form.career_goal} onChange={e => set("career_goal", e.target.value)}
                  className="input-dark appearance-none pr-8">
                  <option value="">Select goal…</option>
                  {CAREER_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4A5568" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card p-5">
          <label className="text-xs font-semibold mb-3 block" style={{ color: "#9CA3AF" }}>YOUR SKILLS</label>
          <SkillInput
            skills={form.skills || []}
            setSkills={s => set("skills", s)}
          />
          <p className="text-xs mt-2" style={{ color: "#4A5568" }}>
            Add skills you currently have. Used for gap analysis and recommendations.
          </p>
        </div>

        {/* Interests */}
        <div className="card p-5">
          <label className="text-xs font-semibold mb-3 block" style={{ color: "#9CA3AF" }}>INTERESTS</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(i => (
              <button key={i}
                onClick={() => toggleInterest(i)}
                className="text-xs px-3 py-1.5 rounded-full transition-all capitalize"
                style={(form.interests || []).includes(i)
                  ? { background: "var(--signal-muted)", color: "var(--signal)", border: "1px solid rgba(79,255,176,0.3)" }
                  : { background: "var(--ink-700)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.05)" }
                }>
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
            saved ? "" : "btn-primary"
          }`}
          style={saved ? {
            background: "rgba(79,255,176,0.15)",
            color: "var(--signal)",
            border: "1px solid rgba(79,255,176,0.3)"
          } : {}}>
          {saved ? (
            <><CheckCircle size={15} /> Profile Saved!</>
          ) : (
            <><Save size={15} /> Save Profile</>
          )}
        </button>
      </div>
    </div>
  );
}
