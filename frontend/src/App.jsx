import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import NavBar from "./components/NavBar";
import ResumePage from "./pages/ResumePage";
import JobsPage from "./pages/JobsPage";
import SkillGapPage from "./pages/SkillGapPage";
import InterviewPage from "./pages/InterviewPage";
import RoadmapPage from "./pages/RoadmapPage";

function Guarded({ children }) {
  const { hasProfile } = useProfile();
  if (!hasProfile) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <p className="text-ink-500">
          Upload your resume first — every other tool builds on it.
        </p>
      </div>
    );
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ResumePage />} />
      <Route path="/jobs" element={<Guarded><JobsPage /></Guarded>} />
      <Route path="/skill-gap" element={<Guarded><SkillGapPage /></Guarded>} />
      <Route path="/interview" element={<Guarded><InterviewPage /></Guarded>} />
      <Route path="/roadmap" element={<Guarded><RoadmapPage /></Guarded>} />
    </Routes>
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <div className="min-h-screen paper-grain">
          <NavBar />
          <AppRoutes />
        </div>
      </BrowserRouter>
    </ProfileProvider>
  );
}
