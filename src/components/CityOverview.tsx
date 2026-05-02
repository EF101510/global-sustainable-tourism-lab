import {
  BookOpen,
  ChevronDown,
  Globe as GlobeIcon,
  Leaf,
  Package,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { getCityDetails } from '../data/city-details';
import type { City } from '../types';

interface CityOverviewProps {
  city: City;
  /** Controlled — parent owns mutex with the IssueCards. */
  expanded: boolean;
  onToggle: () => void;
}

const SECTIONS: ReadonlyArray<{
  key: keyof ReturnType<typeof getCityDetails>;
  label: string;
  Icon: typeof Sparkles;
}> = [
  { key: 'features', label: 'Features', Icon: Sparkles },
  { key: 'environment', label: 'Environment', Icon: Leaf },
  { key: 'geography', label: 'Geography', Icon: GlobeIcon },
  { key: 'products', label: 'Products', Icon: Package },
  { key: 'economy', label: 'Economy', Icon: TrendingUp },
];

/**
 * Multi-section city overview card. Renders the same collapsible shell as
 * IssueCard / CarryingCapacity so the dashboard panel reads as one stack.
 * Each section has its own lucide icon and lighter caption to keep the
 * five-paragraph block scannable.
 */
export default function CityOverview({ city, expanded, onToggle }: CityOverviewProps) {
  const details = getCityDetails(city.id);

  return (
    <div
      className={`rounded-xl liquid-glass liquid-glass-hover transition-colors ${
        expanded ? '!border-cyan-300/60' : ''
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-cyan-700" />
          <span className="text-sm font-semibold text-slate-900">Overview</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-600/70 transition-transform duration-300 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-4 text-slate-800">
            {SECTIONS.map(({ key, label, Icon }) => (
              <section key={key} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-cyan-700" />
                  <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-cyan-800/90">
                    {label}
                  </span>
                </div>
                <p className="text-[12.5px] text-slate-700 leading-relaxed pl-5">
                  {details[key]}
                </p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
