/**
 * Circular score gauge — used for ATS score and match percentages.
 * Pure SVG, no external charting library needed for a single ring.
 */
export default function ScoreGauge({ score, size = 120, label }) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? "#5B7B5A" : score >= 50 ? "#C4512F" : "#8A3A22";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ECE4D2"
            strokeWidth="10"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-2xl font-medium text-ink-900">
            {score}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
}
