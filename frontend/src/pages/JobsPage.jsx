import { useState, useEffect } from "react";
import { MapPin, Building2, ExternalLink, RefreshCw } from "lucide-react";
import { matchJobs } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import Card from "../components/Card";
import Loader from "../components/Loader";

export default function JobsPage() {
  const { profile } = useProfile();
  const [jobs, setJobs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const allSkills = Object.values(profile.skills || {}).flat();
      const result = await matchJobs({
        skills: allSkills,
        recommendedRoles: profile.recommended_roles,
        experienceYears: profile.experience_years,
        currentRole: profile.current_role,
        country: "in",
      });
      setJobs(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <Loader message="Searching live job listings and scoring each match..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-xs text-ink-300 uppercase tracking-wide mb-1">
            {jobs ? `${jobs.length} jobs found` : "Job matches"}
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Jobs that fit your profile
          </h1>
        </div>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-ink-500 hover:bg-paper-200 rounded-md transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <Card className="bg-signal-light/30 border-signal-light mb-4">
          <p className="text-signal-dark text-sm">{error}</p>
        </Card>
      )}

      <div className="space-y-3">
        {(jobs || []).map((job, i) => (
          <Card key={job.id || i}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold text-ink-900">
                  {job.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-ink-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Building2 size={13} />
                    {job.company?.display_name || job.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} />
                    {job.location?.display_name || job.location}
                  </span>
                </div>
                {job.why_good_fit && (
                  <p className="text-sm text-ink-700 mt-3">{job.why_good_fit}</p>
                )}
                {job.matched_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.matched_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-sage-light text-sage-dark rounded text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                    {job.missing_skills?.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-paper-200 text-ink-300 rounded text-xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="text-right">
                  <span className="font-mono text-2xl font-medium text-ink-900">
                    {job.match_score ?? "—"}
                  </span>
                  <span className="text-ink-300 text-sm">%</span>
                  <p className="text-xs text-ink-300">match</p>
                </div>
                {job.redirect_url && (
                  <a
                    href={job.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-signal hover:text-signal-dark font-medium"
                  >
                    View job <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {jobs && jobs.length === 0 && (
        <Card className="text-center py-10">
          <p className="text-ink-500">No jobs found right now. Try refreshing.</p>
        </Card>
      )}
    </div>
  );
}
