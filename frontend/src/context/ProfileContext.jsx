import { createContext, useContext, useState } from "react";

const ProfileContext = createContext(null);

/**
 * Wraps the app and holds the candidate's analyzed resume profile
 * so every page (Jobs, Skill Gap, Interview Prep, Roadmap) can read it
 * without re-uploading the resume each time.
 */
export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null); // result from analyzeResume()
  const [targetRole, setTargetRole] = useState(""); // role user picked to focus on
  const [skillGapResult, setSkillGapResult] = useState(null);

  const value = {
    profile,
    setProfile,
    targetRole,
    setTargetRole,
    skillGapResult,
    setSkillGapResult,
    hasProfile: profile !== null,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used inside a ProfileProvider");
  }
  return ctx;
}
