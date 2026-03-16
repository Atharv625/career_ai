import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Chat ──────────────────────────────────────────────
export const sendChatMessage = (userId, message, studentEmail = null) =>
  api.post("/chat/", { user_id: userId, message, student_email: studentEmail })
     .then(r => r.data);

export const clearChatSession = (userId) =>
  api.post("/chat/clear-session", { user_id: userId }).then(r => r.data);

export const getChatHistory = (userId) =>
  api.get(`/chat/history/${userId}`).then(r => r.data);

// ── Careers ───────────────────────────────────────────
export const getCareers = (params = {}) =>
  api.get("/careers/", { params }).then(r => r.data);

export const getCareer = (name) =>
  api.get(`/careers/${encodeURIComponent(name)}`).then(r => r.data);

export const searchCareers = (query) =>
  api.get(`/careers/search/${encodeURIComponent(query)}`).then(r => r.data);

// ── Students ──────────────────────────────────────────
export const createStudent = (data) =>
  api.post("/students/", data).then(r => r.data);

export const getStudent = (email) =>
  api.get(`/students/${encodeURIComponent(email)}`).then(r => r.data);

export const updateStudent = (email, data) =>
  api.put(`/students/${encodeURIComponent(email)}`, data).then(r => r.data);

// ── Recommendations ───────────────────────────────────
export const getCareerRecommendations = (payload) =>
  api.post("/recommendations/careers", payload).then(r => r.data);

export const getCourseRecommendations = (payload) =>
  api.post("/recommendations/courses", payload).then(r => r.data);

// ── Skill Gap ─────────────────────────────────────────
export const analyzeSkillGap = (userSkills, careerName) =>
  api.post("/skill-gap/analyze", { user_skills: userSkills, career_name: careerName })
     .then(r => r.data);

export const compareAllCareers = (userSkills) =>
  api.post("/skill-gap/compare-all", { user_skills: userSkills }).then(r => r.data);

// ── Roadmap ───────────────────────────────────────────
export const getRoadmap = (careerName, userSkills = [], userGoal = "") =>
  api.post("/roadmap/", { career_name: careerName, user_skills: userSkills, user_goal: userGoal })
     .then(r => r.data);

export const getRoadmapCareers = () =>
  api.get("/roadmap/careers").then(r => r.data);

export default api;
