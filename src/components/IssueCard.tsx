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
    <div
      className={`rounded-xl liquid-glass liquid-glass-hover transition-colors ${
        expanded ? "!border-cyan-300/60" : ""
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{issue.icon}</span>
          <span className="text-sm font-semibold text-slate-900">{issue.tag}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-600/70 transition-transform duration-300 shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-xs text-slate-700 leading-relaxed px-4 pb-4">
            {issue.detail}
          </p>
        </div>
      </div>
    </div>
  );
}
