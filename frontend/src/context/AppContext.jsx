import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);

const DEFAULT_PROFILE = {
  name: "",
  email: "",
  skills: [],
  interests: [],
  education: "bachelor",
  career_goal: "",
};

export function AppProvider({ children }) {
  const [profile, setProfile]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("ca_profile")) || DEFAULT_PROFILE; }
    catch { return DEFAULT_PROFILE; }
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [userId]                        = useState(() => {
    let id = localStorage.getItem("ca_user_id");
    if (!id) { id = `user_${Date.now()}`; localStorage.setItem("ca_user_id", id); }
    return id;
  });

  // Persist profile
  useEffect(() => {
    localStorage.setItem("ca_profile", JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates) => setProfile(prev => ({ ...prev, ...updates }));
  const addSkill      = (skill)   => setProfile(prev => ({
    ...prev,
    skills: prev.skills.includes(skill) ? prev.skills : [...prev.skills, skill]
  }));
  const removeSkill   = (skill)   => setProfile(prev => ({
    ...prev,
    skills: prev.skills.filter(s => s !== skill)
  }));
  const addInterest   = (int)     => setProfile(prev => ({
    ...prev,
    interests: prev.interests.includes(int) ? prev.interests : [...prev.interests, int]
  }));
  const removeInterest = (int)    => setProfile(prev => ({
    ...prev,
    interests: prev.interests.filter(i => i !== int)
  }));

  return (
    <AppContext.Provider value={{
      profile, updateProfile, addSkill, removeSkill, addInterest, removeInterest,
      chatMessages, setChatMessages,
      userId,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
