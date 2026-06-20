import { NavLink } from "react-router-dom";
import { FileSearch, Briefcase, Target, MessageSquare, Map } from "lucide-react";
import { useProfile } from "../context/ProfileContext";

const NAV_ITEMS = [
  { to: "/", label: "Resume", icon: FileSearch },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/skill-gap", label: "Skill gap", icon: Target },
  { to: "/interview", label: "Interview", icon: MessageSquare },
  { to: "/roadmap", label: "Roadmap", icon: Map },
];

export default function NavBar() {
  const { hasProfile } = useProfile();

  return (
    <header className="border-b border-paper-300 bg-paper-50/95 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold text-ink-900">
            Copilot
          </span>
          <span className="font-mono text-xs text-ink-300 tracking-wide">
            v1.0
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const locked = to !== "/" && !hasProfile;
            return (
              <NavLink
                key={to}
                to={locked ? "#" : to}
                onClick={(e) => locked && e.preventDefault()}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    locked
                      ? "text-ink-300 cursor-not-allowed"
                      : isActive
                      ? "bg-ink-900 text-paper-50"
                      : "text-ink-500 hover:bg-paper-200",
                  ].join(" ")
                }
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
