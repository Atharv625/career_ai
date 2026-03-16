import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";

const COMMON_SKILLS = [
  "Python", "JavaScript", "React", "Node.js", "SQL", "Machine Learning",
  "Docker", "AWS", "Git", "TypeScript", "Java", "C++", "TensorFlow",
  "Kubernetes", "Linux", "MongoDB", "PostgreSQL", "Deep Learning",
  "Statistics", "Figma", "Solidity", "Go", "Rust"
];

export default function SkillInput({ skills = [], setSkills, placeholder = "Add a skill…" }) {
  const [input, setInput]       = useState("");
  const [focused, setFocused]   = useState(false);
  const inputRef = useRef(null);

  const filtered = input.trim().length > 0
    ? COMMON_SKILLS.filter(s =>
        s.toLowerCase().includes(input.toLowerCase()) && !skills.includes(s)
      ).slice(0, 6)
    : [];

  const add = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setInput("");
    inputRef.current?.focus();
  };

  const remove = (skill) => setSkills(skills.filter(s => s !== skill));

  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && skills.length > 0) {
      remove(skills[skills.length - 1]);
    }
  };

  return (
    <div>
      {/* Tag display + input */}
      <div
        className="flex flex-wrap gap-1.5 p-2.5 rounded-lg min-h-[42px] cursor-text"
        style={{
          background: "var(--ink-700)",
          border: `1px solid ${focused ? "rgba(79,255,176,0.4)" : "rgba(255,255,255,0.08)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(79,255,176,0.08)" : "none",
          transition: "border-color 0.2s, box-shadow 0.2s"
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {skills.map(s => (
          <span key={s}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--signal-muted)", color: "var(--signal)", border: "1px solid rgba(79,255,176,0.2)" }}>
            {s}
            <button onClick={(e) => { e.stopPropagation(); remove(s); }}
              className="hover:text-white transition-colors rounded-full">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={skills.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent border-none outline-none text-xs min-w-[100px]"
          style={{ color: "#E8ECF4", fontFamily: "'DM Sans', sans-serif" }}
        />
      </div>

      {/* Autocomplete suggestions */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {filtered.map(s => (
            <button key={s}
              onMouseDown={(e) => { e.preventDefault(); add(s); }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all hover:-translate-y-0.5"
              style={{ background: "var(--ink-600)", color: "#9CA3AF", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Plus size={9} /> {s}
            </button>
          ))}
        </div>
      )}

      {/* Common quick-adds */}
      {skills.length === 0 && !input && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs" style={{ color: "#4A5568" }}>Quick add:</span>
          {["Python", "JavaScript", "SQL", "Machine Learning", "Docker", "React"].map(s => (
            <button key={s}
              onClick={() => add(s)}
              className="text-xs px-2 py-0.5 rounded-full transition-all"
              style={{ background: "var(--ink-600)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.05)" }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
