import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { generateInterviewQuestions } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import Card from "../components/Card";
import Loader from "../components/Loader";

export default function InterviewPage() {
  const { profile, targetRole, setTargetRole } = useProfile();
  const [role, setRole] = useState(targetRole || profile?.recommended_roles?.[0] || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSections, setOpenSections] = useState({});

  const handleGenerate = async () => {
    if (!role.trim()) {
      setError("Enter a target role first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const allSkills = Object.values(profile.skills || {}).flat();
      const data = await generateInterviewQuestions({
        skills: allSkills,
        experienceYears: profile.experience_years,
        projects: profile.projects,
        targetRole: role,
      });
      setResult(data);
      setTargetRole(role);
      setOpenSections({ 0: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (i) => {
    setOpenSections((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  if (loading) {
    return <Loader message="Preparing role-specific interview questions..." />;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div>
        <p className="font-mono text-xs text-ink-300 uppercase tracking-wide mb-1">
          Interview prep
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Practice for a specific role
        </h1>
      </div>

      <Card>
        <div className="flex gap-2">
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. AI/ML Engineer"
            className="flex-1 bg-paper-100 border border-paper-300 rounded-md px-3 py-2 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-ink-300"
          />
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-ink-900 text-paper-50 rounded-md text-sm font-medium hover:bg-ink-700 transition-colors whitespace-nowrap"
          >
            Generate questions
          </button>
        </div>
        {error && <p className="text-signal-dark text-sm mt-2">{error}</p>}
      </Card>

      {result && (
        <>
          <Card className="bg-ink-900 border-ink-900">
            <h2 className="font-display text-base font-semibold text-paper-50 mb-2">
              Prep tips for you
            </h2>
            <ul className="space-y-1.5">
              {(result.preparation_tips || []).map((tip, i) => (
                <li key={i} className="text-sm text-paper-100">
                  • {tip}
                </li>
              ))}
            </ul>
          </Card>

          {(result.sections || []).map((section, i) => (
            <Card key={i} className="overflow-hidden p-0">
              <button
                onClick={() => toggleSection(i)}
                className="w-full flex items-center justify-between p-5 hover:bg-paper-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display font-semibold text-ink-900">
                    {section.category}
                  </span>
                  <span className="font-mono text-xs text-ink-300">
                    {section.questions?.length} questions
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-ink-300 transition-transform ${
                    openSections[i] ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openSections[i] && (
                <div className="px-5 pb-5 space-y-4">
                  {(section.questions || []).map((q, qi) => (
                    <div key={qi} className="border-t border-paper-200 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-ink-700 font-medium">{q.question}</p>
                        <span
                          className={[
                            "flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium",
                            q.difficulty === "hard"
                              ? "bg-signal-light text-signal-dark"
                              : q.difficulty === "medium"
                              ? "bg-paper-300 text-ink-700"
                              : "bg-sage-light text-sage-dark",
                          ].join(" ")}
                        >
                          {q.difficulty}
                        </span>
                      </div>
                      {q.tip && (
                        <p className="text-xs text-ink-500 mt-1.5">💡 {q.tip}</p>
                      )}
                      {q.expected_duration_minutes && (
                        <p className="flex items-center gap-1 text-xs text-ink-300 mt-1">
                          <Clock size={11} />
                          ~{q.expected_duration_minutes} min
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
