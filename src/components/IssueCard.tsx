import { ChevronDown } from 'lucide-react';
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
      className={`glass-card w-full text-left rounded-xl ${expanded ? 'is-active' : ''}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-2xl shrink-0">{issue.icon}</span>
          <span className="text-base font-semibold text-white break-words min-w-0">
            {issue.tag}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-white/60 transition-transform duration-300 shrink-0 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </div>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm text-white/85 leading-relaxed px-4 sm:px-5 pb-4 sm:pb-5">
            {issue.detail}
          </p>
        </div>
      </div>
    </button>
  );
}
