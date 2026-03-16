import { useState } from "react";
import { GraduationCap, Star, ExternalLink, RefreshCw, ChevronDown, Search } from "lucide-react";
import { getCourseRecommendations } from "../services/api";
import SkillInput from "../components/skills/SkillInput";
import { useApp } from "../context/AppContext";

const CAREERS = [
  "AI/ML Engineer", "Full Stack Developer", "Cloud/DevOps Engineer",
  "Data Scientist", "Cybersecurity Engineer", "Blockchain Developer",
  "UX/UI Designer", "Product Manager"
];

const PLATFORMS = ["", "Coursera", "Udemy", "edX / Harvard", "Google Cloud", "AWS", "University of Helsinki", "CompTIA"];

function CourseCard({ course, idx }) {
  return (
    <div className="card p-4 animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-snug mb-0.5">{course.course_name}</h3>
          <div className="text-xs" style={{ color: "#6B7280" }}>{course.platform} · {course.instructor}</div>
        </div>
        <a href={course.url || "#"} target="_blank" rel="noreferrer"
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:text-white"
          style={{ color: "#4A5568", background: "var(--ink-700)" }}>
          <ExternalLink size={13} />
        </a>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-1 text-xs">
          <Star size={11} style={{ color: "#FCD34D" }} />
          <span className="font-medium text-white">{course.rating}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded"
          style={{ background: "var(--ink-700)", color: "#9CA3AF" }}>{course.duration}</span>
        <span className="text-xs px-2 py-0.5 rounded"
          style={{ background: "rgba(79,255,176,0.08)", color: "var(--signal)" }}>{course.price}</span>
        <span className="text-xs px-2 py-0.5 rounded"
          style={{ background: "var(--ink-700)", color: "#6B7280" }}>{course.difficulty}</span>
      </div>

      {course.skills_taught?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {course.skills_taught.slice(0, 4).map(s => (
            <span key={s} className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: "var(--ink-700)", color: "#6B7280" }}>{s}</span>
          ))}
          {course.skills_taught.length > 4 && (
            <span className="text-xs" style={{ color: "#4A5568" }}>+{course.skills_taught.length - 4} more</span>
          )}
        </div>
      )}

      {course.skills_covered?.length > 0 && (
        <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: "rgba(79,255,176,0.06)", color: "var(--signal)" }}>
          Covers your gaps: {course.skills_covered.join(", ")}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  const { profile } = useApp();
  const [career, setCareer]           = useState("");
  const [skills, setSkills]           = useState(profile.skills || []);
  const [platform, setPlatform]       = useState("");
  const [difficulty, setDifficulty]   = useState("");
  const [courses, setCourses]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const run = async () => {
    setError(""); setLoading(true);
    try {
      const data = await getCourseRecommendations({
        career_name: career || undefined,
        missing_skills: skills.length > 0 ? skills : undefined,
        platform: platform || undefined,
        difficulty: difficulty || undefined,
        top_k: 9
      });
      setCourses(data.courses);
    } catch {
      setError("Failed to fetch courses. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Course Finder</h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>Find the best courses to close your skill gaps and advance your career.</p>
      </div>

      <div className="card p-5 mb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#9CA3AF" }}>CAREER</label>
            <div className="relative">
              <select value={career} onChange={e => setCareer(e.target.value)} className="input-dark appearance-none pr-8">
                <option value="">Any career</option>
                {CAREERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4A5568" }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#9CA3AF" }}>PLATFORM</label>
            <div className="relative">
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="input-dark appearance-none pr-8">
                <option value="">Any platform</option>
                {PLATFORMS.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4A5568" }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#9CA3AF" }}>DIFFICULTY</label>
            <div className="relative">
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input-dark appearance-none pr-8">
                <option value="">Any level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4A5568" }} />
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={run} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><RefreshCw size={14} className="animate-spin" /> Searching…</> : <><Search size={14} /> Find Courses</>}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#9CA3AF" }}>SKILLS TO COVER (optional)</label>
          <SkillInput skills={skills} setSkills={setSkills} placeholder="Add skills you want to learn…" />
        </div>
        {error && <p className="text-xs mt-2 px-3 py-2 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#F87171" }}>{error}</p>}
      </div>

      {courses === null ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <GraduationCap size={40} style={{ color: "var(--signal)", opacity: 0.3 }} className="mb-4" />
          <p className="text-sm font-medium text-white mb-1">Set your filters and search</p>
          <p className="text-xs" style={{ color: "#4A5568" }}>Courses will appear here ranked by relevance</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "#6B7280" }}>No courses match your filters. Try broader criteria.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={15} style={{ color: "var(--signal)" }} />
            <span className="text-sm font-semibold text-white">{courses.length} Courses Found</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c, i) => <CourseCard key={c.course_name} course={c} idx={i} />)}
          </div>
        </>
      )}
    </div>
  );
}
