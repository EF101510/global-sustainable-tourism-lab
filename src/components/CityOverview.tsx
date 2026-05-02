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
 */
export default function CityOverview({ city, expanded, onToggle }: CityOverviewProps) {
  const details = getCityDetails(city.id);

  return (
    <div className={`glass-card rounded-xl ${expanded ? 'is-active' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <BookOpen className="w-6 h-6 text-cyan-300 shrink-0" />
          <span className="text-base font-semibold text-white break-words min-w-0">
            Overview
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-white/60 transition-transform duration-300 shrink-0 ${
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
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 text-white">
            {SECTIONS.map(({ key, label, Icon }) => (
              <section key={key} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-cyan-200" />
                  <span className="text-xs uppercase tracking-[0.18em] font-semibold text-cyan-100/85">
                    {label}
                  </span>
                </div>
                <p className="text-sm text-white/85 leading-relaxed pl-5">
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
