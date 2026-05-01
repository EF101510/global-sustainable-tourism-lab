import { ChevronDown } from "lucide-react";
import type { CityIssue } from "../types";

interface IssueCardProps {
  issue: CityIssue;
  expanded: boolean;
  onToggle: () => void;
}

export default function IssueCard({
  issue,
  expanded,
  onToggle,
}: IssueCardProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left rounded-xl border backdrop-blur-3xl backdrop-saturate-[180%] transition-colors bg-slate-700/40 hover:bg-slate-700/55 ${
        expanded ? "border-cyan-300/60" : "border-white/20"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="text-xl">{issue.icon}</span>
          <span className="text-sm font-semibold text-white">{issue.tag}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/60 transition-transform duration-300 shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </div>
      {/* grid-template-rows trick: animates 0fr ↔ 1fr so the panel grows
          to its natural content height without us hard-coding a max-height. */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-xs text-white/85 leading-relaxed px-4 pb-4">
            {issue.detail}
          </p>
        </div>
      </div>
    </button>
  );
}
