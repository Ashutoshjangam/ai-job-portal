import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { analyzeResume } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import Card from "../components/Card";
import ScoreGauge from "../components/ScoreGauge";
import Loader from "../components/Loader";

export default function ResumePage() {
  const { profile, setProfile } = useProfile();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const result = await analyzeResume(file);
        setProfile(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [setProfile]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  if (loading) {
    return <Loader message="Reading your resume and scoring it against ATS criteria..." />;
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl font-semibold text-ink-900 mb-3">
            Let's see what your resume says
          </h1>
          <p className="text-ink-500">
            Upload a PDF and get your ATS score, extracted skills, and concrete fixes — in under a minute.
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={[
            "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
            dragActive
              ? "border-signal bg-signal-light/30"
              : "border-paper-300 bg-paper-100 hover:border-ink-300",
          ].join(" ")}
          onClick={() => document.getElementById("resume-input").click()}
        >
          <input
            id="resume-input"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Upload className="mx-auto mb-4 text-ink-300" size={32} strokeWidth={1.5} />
          <p className="font-medium text-ink-700 mb-1">
            Drop your resume here, or click to browse
          </p>
          <p className="text-sm text-ink-300">PDF only, max 5MB</p>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 text-signal-dark bg-signal-light/40 border border-signal-light rounded-md p-3 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // ── Results view ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      {/* Header with score */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="font-mono text-xs text-ink-300 uppercase tracking-wide mb-1">
            Resume analysis
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            {profile.candidate_name}
          </h1>
          <p className="text-ink-500 mt-2 max-w-xl text-sm leading-relaxed">
            {profile.summary}
          </p>
        </div>
        <ScoreGauge score={profile.ats_score} label="ATS score" size={110} />
      </div>

      {/* ATS breakdown */}
      <Card>
        <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
          Score breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Object.entries(profile.ats_breakdown || {}).map(([key, value]) => (
            <div key={key}>
              <p className="text-xs text-ink-300 capitalize mb-1">
                {key.replace(/_/g, " ")}
              </p>
              <div className="h-1.5 bg-paper-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ink-700 rounded-full"
                  style={{ width: `${value}%` }}
                />
              </div>
              <p className="font-mono text-sm text-ink-700 mt-1">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Skills */}
      <Card>
        <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
          Skills found
        </h2>
        <div className="space-y-3">
          {Object.entries(profile.skills || {}).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-medium text-ink-300 uppercase tracking-wide mb-1.5">
                {category}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-paper-200 text-ink-700 rounded text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Improvements */}
      <Card>
        <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
          What to fix
        </h2>
        <div className="space-y-3">
          {(profile.improvements || []).map((item, i) => (
            <div key={i} className="flex gap-3">
              <span
                className={[
                  "mt-0.5 flex-shrink-0 w-2 h-2 rounded-full",
                  item.priority === "high"
                    ? "bg-signal"
                    : item.priority === "medium"
                    ? "bg-ink-300"
                    : "bg-paper-300",
                ].join(" ")}
              />
              <div>
                <p className="text-sm text-ink-700">{item.issue}</p>
                <p className="text-sm text-ink-500 mt-0.5">→ {item.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Strengths */}
      <Card>
        <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
          Strengths
        </h2>
        <div className="space-y-2">
          {(profile.strengths || []).map((s, i) => (
            <div key={i} className="flex gap-2 text-sm text-ink-700">
              <CheckCircle2 size={16} className="text-sage mt-0.5 flex-shrink-0" />
              {s}
            </div>
          ))}
        </div>
      </Card>

      {/* Recommended roles + CTA */}
      <Card className="bg-ink-900 border-ink-900">
        <h2 className="font-display text-lg font-semibold text-paper-50 mb-3">
          Recommended roles
        </h2>
        <div className="flex flex-wrap gap-2 mb-5">
          {(profile.recommended_roles || []).map((role) => (
            <span
              key={role}
              className="px-3 py-1.5 bg-paper-50/10 text-paper-50 rounded text-sm"
            >
              {role}
            </span>
          ))}
        </div>
        <button
          onClick={() => navigate("/jobs")}
          className="flex items-center gap-2 px-4 py-2 bg-signal text-paper-50 rounded-md text-sm font-medium hover:bg-signal-dark transition-colors"
        >
          <FileText size={15} />
          Find matching jobs
          <ArrowRight size={15} />
        </button>
      </Card>
    </div>
  );
}
