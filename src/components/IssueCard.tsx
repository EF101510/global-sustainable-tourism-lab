import type { CityIssue } from '../types';

interface IssueCardProps {
  issue: CityIssue;
  expanded: boolean;
  onToggle: () => void;
}

export default function IssueCard({ issue, expanded, onToggle }: IssueCardProps) {
  return (
    <button
      onClick={onToggle}
      className={`text-left p-4 rounded-xl border transition-all backdrop-blur-md ${
        expanded
          ? 'bg-white/20 border-cyan-300/50 col-span-2'
          : 'bg-white/10 hover:bg-white/15 border-white/15'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{issue.icon}</span>
        <span className="text-sm font-semibold text-white">{issue.tag}</span>
      </div>
      {expanded && (
        <p className="text-xs text-white/85 mt-3 leading-relaxed">{issue.detail}</p>
      )}
    </button>
  );
}
