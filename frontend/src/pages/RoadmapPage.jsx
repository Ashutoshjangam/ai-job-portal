import { useState } from "react";
import { ExternalLink, Flag } from "lucide-react";
import { generateLearningRoadmap } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import Card from "../components/Card";
import Loader from "../components/Loader";

export default function RoadmapPage() {
  const { profile, targetRole, skillGapResult } = useProfile();
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!targetRole) {
      setError("Run a skill gap analysis first so we know what to plan for.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const allSkills = Object.values(profile.skills || {}).flat();
      const missing = skillGapResult?.missing_skills || [];
      const data = await generateLearningRoadmap({
        currentSkills: allSkills,
        missingSkills: missing,
        experienceYears: profile.experience_years,
        targetRole,
        hoursPerWeek,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Building your week-by-week learning plan..." />;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div>
        <p className="font-mono text-xs text-ink-300 uppercase tracking-wide mb-1">
          Learning roadmap
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Your path to {targetRole || "your target role"}
        </h1>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <label className="text-sm text-ink-500">Hours per week:</label>
          <input
            type="range"
            min="2"
            max="40"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="flex-1"
          />
          <span className="font-mono text-sm text-ink-900 w-10">{hoursPerWeek}h</span>
        </div>
        {error && <p className="text-signal-dark text-sm mt-2">{error}</p>}
        <button
          onClick={handleGenerate}
          className="mt-3 px-4 py-2 bg-ink-900 text-paper-50 rounded-md text-sm font-medium hover:bg-ink-700 transition-colors"
        >
          Generate roadmap
        </button>
      </Card>

      {result?.message && (
        <Card className="bg-sage-light/40 border-sage-light text-center py-8">
          <p className="text-sage-dark">{result.message}</p>
        </Card>
      )}

      {result?.phases?.length > 0 && (
        <>
          <Card className="bg-ink-900 border-ink-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-paper-100 text-sm">{result.motivational_note}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="font-mono text-lg text-paper-50">{result.total_weeks}wk</p>
                <p className="text-xs text-paper-300">{result.estimated_job_ready_date}</p>
              </div>
            </div>
          </Card>

          {result.phases.map((phase) => (
            <Card key={phase.phase}>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-xs text-paper-50 bg-ink-700 px-2 py-0.5 rounded">
                  Phase {phase.phase}
                </span>
                <h2 className="font-display font-semibold text-ink-900">{phase.title}</h2>
                <span className="text-xs text-ink-300">weeks {phase.weeks}</span>
              </div>
              <p className="text-sm text-ink-500 mb-4">{phase.goal}</p>

              <div className="space-y-4">
                {(phase.topics || []).map((topic, i) => (
                  <div key={i} className="border-t border-paper-200 pt-4">
                    <p className="font-medium text-ink-700 text-sm mb-2">{topic.skill}</p>
                    <div className="space-y-1.5 mb-2">
                      {(topic.resources || []).map((r, ri) => (
                        <a
                          key={ri}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between text-sm group"
                        >
                          <span className="text-ink-700 group-hover:text-signal flex items-center gap-1.5">
                            {r.name}
                            <ExternalLink size={11} className="text-ink-300" />
                          </span>
                          <span className="flex items-center gap-2 text-xs text-ink-300">
                            {r.free && (
                              <span className="text-sage-dark bg-sage-light px-1.5 py-0.5 rounded">
                                free
                              </span>
                            )}
                            {r.duration_hours}h
                          </span>
                        </a>
                      ))}
                    </div>
                    {topic.practice_project && (
                      <p className="text-xs text-ink-500 bg-paper-100 rounded p-2 mt-2">
                        🔨 {topic.practice_project}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}

          <Card>
            <h2 className="font-display font-semibold text-ink-900 mb-3 flex items-center gap-2">
              <Flag size={16} />
              Milestones
            </h2>
            <div className="space-y-2">
              {(result.milestones || []).map((m, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="font-mono text-ink-300 flex-shrink-0">
                    wk {m.week}
                  </span>
                  <div>
                    <p className="text-ink-700">{m.milestone}</p>
                    <p className="text-ink-300 text-xs">{m.proof_of_work}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
