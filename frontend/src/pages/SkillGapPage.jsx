import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { analyzeSkillGap } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import Card from "../components/Card";
import ScoreGauge from "../components/ScoreGauge";
import Loader from "../components/Loader";

export default function SkillGapPage() {
  const { profile, skillGapResult, setSkillGapResult, setTargetRole } = useProfile();
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (jobDescription.trim().length < 10) {
      setError("Paste a fuller job description — just a title won't give a useful comparison.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const allSkills = Object.values(profile.skills || {}).flat();
      const result = await analyzeSkillGap({
        candidateSkills: allSkills,
        jobDescription,
      });
      setSkillGapResult(result);
      setTargetRole(result.job_title || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Comparing your skills against the job requirements..." />;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div>
        <p className="font-mono text-xs text-ink-300 uppercase tracking-wide mb-1">
          Skill gap analysis
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Paste a job description
        </h1>
        <p className="text-ink-500 mt-1 text-sm">
          We'll compare it against your resume and show exactly what's missing.
        </p>
      </div>

      <Card>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={8}
          className="w-full bg-paper-100 border border-paper-300 rounded-md p-3 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-ink-300 resize-none"
        />
        {error && <p className="text-signal-dark text-sm mt-2">{error}</p>}
        <button
          onClick={handleAnalyze}
          className="mt-3 px-4 py-2 bg-ink-900 text-paper-50 rounded-md text-sm font-medium hover:bg-ink-700 transition-colors"
        >
          Analyze gap
        </button>
      </Card>

      {skillGapResult && (
        <>
          <Card>
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  {skillGapResult.job_title}
                </h2>
                <p className="text-sm text-ink-500 mt-1 max-w-md">
                  {skillGapResult.overall_verdict}
                </p>
              </div>
              <ScoreGauge score={skillGapResult.match_percentage} label="Match" size={100} />
            </div>
          </Card>

          <Card>
            <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
              Missing skills
            </h3>
            <div className="space-y-2">
              {(skillGapResult.missing_skills || []).map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-paper-200 last:border-0">
                  <span className="text-sm text-ink-700">{s.skill}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-300">{s.learn_in}</span>
                    <span
                      className={[
                        "px-2 py-0.5 rounded text-xs font-medium",
                        s.importance === "critical"
                          ? "bg-signal-light text-signal-dark"
                          : "bg-paper-200 text-ink-500",
                      ].join(" ")}
                    >
                      {s.importance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-display text-base font-semibold text-ink-900 mb-3">
              You already have
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(skillGapResult.matched_skills || []).map((s, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-sage-light text-sage-dark rounded text-sm"
                >
                  {s.skill}
                </span>
              ))}
            </div>
          </Card>

          <button
            onClick={() => navigate("/roadmap")}
            className="flex items-center gap-2 px-4 py-2 bg-signal text-paper-50 rounded-md text-sm font-medium hover:bg-signal-dark transition-colors"
          >
            Build a learning plan
            <ArrowRight size={15} />
          </button>
        </>
      )}
    </div>
  );
}
