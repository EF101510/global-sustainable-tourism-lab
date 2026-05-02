import { useEffect, useState } from 'react';
import { BarChart3, ChevronDown, Sparkles } from 'lucide-react';
import Formula from './Formula';
import {
  estimateCarryingCapacity,
  type CarryingCapacityEstimate,
} from '../lib/chat-api';
import { getCarryingCapacityDefaults } from '../data/carrying-capacity';
import type { City } from '../types';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  accent?: boolean;
}

function NumberField({ label, value, onChange, step = 1, accent }: NumberFieldProps) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-[0.15em] uppercase text-slate-600 mb-1.5">
        {label}
      </div>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={`w-full bg-white/40 text-slate-900 text-sm rounded-md px-3 py-2 border tabular-nums focus:outline-none transition-colors ${
          accent
            ? 'border-cyan-500/60 focus:border-cyan-600/80'
            : 'border-white/60 focus:border-slate-400/60'
        }`}
      />
    </label>
  );
}

interface CarryingCapacityCalculatorProps {
  city: City;
  /** Controlled — parent owns mutex with the IssueCards. */
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Interactive carrying-capacity calculator. Renders the spec's LaTeX formula
 *   C = (A × U_f) / R_t
 * with editable inputs seeded from per-city defaults. Expansion is
 * controlled by the parent so it can share a one-card-open mutex with the
 * IssueCards. The "Real-time estimate" button asks the backend chat proxy
 * for fresh values via Anthropic.
 */
export default function CarryingCapacityCalculator({
  city,
  expanded,
  onToggle,
}: CarryingCapacityCalculatorProps) {
  const defaults = getCarryingCapacityDefaults(city.id);
  const [siteName, setSiteName] = useState(defaults.siteName);
  const [area, setArea] = useState(defaults.area);
  const [spacePerPerson, setSpacePerPerson] = useState(defaults.spacePerPerson);
  const [stayTime, setStayTime] = useState(defaults.stayTime);
  const [actual, setActual] = useState(defaults.actualVisitors);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // Reset to per-city defaults when navigating to a different city. The
  // expanded state is owned by the parent so we don't touch it here.
  useEffect(() => {
    const d = getCarryingCapacityDefaults(city.id);
    setSiteName(d.siteName);
    setArea(d.area);
    setSpacePerPerson(d.spacePerPerson);
    setStayTime(d.stayTime);
    setActual(d.actualVisitors);
    setEstimateError(null);
  }, [city.id]);

  const handleEstimate = async () => {
    if (estimating) return;
    setEstimating(true);
    setEstimateError(null);
    try {
      const est: CarryingCapacityEstimate = await estimateCarryingCapacity(city);
      if (est.siteName) setSiteName(est.siteName);
      setArea(est.area);
      setSpacePerPerson(est.spacePerPerson);
      setStayTime(est.stayTime);
      setActual(est.actualVisitors);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setEstimateError(`⚠️ ${detail}`);
    } finally {
      setEstimating(false);
    }
  };

  const capacity =
    stayTime > 0 ? Math.round((area * spacePerPerson) / stayTime) : 0;
  const overTourism = actual > capacity;
  const overflowPct =
    capacity > 0 ? Math.round(((actual - capacity) / capacity) * 100) : 0;
  const headroomPct =
    capacity > 0
      ? Math.max(0, Math.round(((capacity - actual) / capacity) * 100))
      : 0;

  const maxValue = Math.max(actual, capacity, 1);
  const capacityBarPct = (capacity / maxValue) * 100;
  const actualBarPct = (actual / maxValue) * 100;

  return (
    <div
      className={`rounded-xl liquid-glass liquid-glass-hover transition-colors ${
        expanded ? '!border-cyan-300/60' : ''
      }`}
    >
      {/* Collapsible header — sibling (not parent) of body so inner buttons
          don't get nested inside this <button> element. */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-cyan-700" />
          <span className="text-sm font-semibold text-slate-900">
            Carrying Capacity
          </span>
        </div>
        <div className="flex items-center gap-2">
          {overTourism ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-800 border border-rose-500/40 tabular-nums">
              ⚠ {overflowPct}% over
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 border border-emerald-500/40 tabular-nums">
              ✓ {headroomPct}% headroom
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-600/70 transition-transform duration-300 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Body — grid-template-rows trick for smooth height animation. */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-5 text-slate-800">
            {/* Site label + AI estimate button */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] tracking-[0.15em] uppercase text-slate-600">
                  Focal site
                </div>
                <div className="text-sm font-medium text-slate-900 mt-0.5 truncate">
                  {siteName}
                </div>
              </div>
              <button
                onClick={handleEstimate}
                disabled={estimating}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/25 hover:bg-cyan-500/40 disabled:bg-white/30 disabled:cursor-not-allowed border border-cyan-600/40 disabled:border-slate-400/30 rounded-md text-xs text-cyan-900 disabled:text-slate-500 transition-colors"
              >
                <Sparkles
                  className={`w-3.5 h-3.5 ${estimating ? 'animate-spin' : ''}`}
                />
                {estimating ? 'Estimating…' : 'Real-time estimate'}
              </button>
            </div>

            {/* Formula */}
            <div className="bg-white/40 border border-white/60 rounded-lg py-4 px-3 text-center">
              <Formula tex="C = \frac{A \times U_f}{R_t}" />
              <p className="text-[10.5px] text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
                A = site area · U<sub>f</sub> = space per person · R
                <sub>t</sub> = average stay time. Overtourism occurs when
                actual visitors exceed C.
              </p>
            </div>

            {estimateError && (
              <div className="bg-amber-500/30 border border-amber-500/50 rounded-md px-3 py-2 text-[11px] text-amber-900">
                {estimateError}
              </div>
            )}

            {/* Inputs for the three formula variables */}
            <div className="grid grid-cols-3 gap-3">
              <NumberField
                label="A (m²)"
                value={area}
                onChange={setArea}
                step={500}
              />
              <NumberField
                label="Uf (m² / person)"
                value={spacePerPerson}
                onChange={setSpacePerPerson}
                step={0.5}
              />
              <NumberField
                label="Rt (hours)"
                value={stayTime}
                onChange={setStayTime}
                step={0.5}
              />
            </div>

            {/* Calculated capacity */}
            <div className="bg-cyan-500/25 border border-cyan-600/45 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-[0.15em] uppercase text-cyan-900/85">
                  Daily capacity
                </div>
                <div className="text-[10px] text-cyan-800/70 mt-0.5">C</div>
              </div>
              <span className="text-3xl font-light text-slate-900 tabular-nums">
                {capacity.toLocaleString()}
              </span>
            </div>

            {/* Actual visitor count */}
            <NumberField
              label="Actual daily visitors"
              value={actual}
              onChange={setActual}
              step={500}
              accent
            />

            {/* Bar chart comparison */}
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.15em] text-slate-600 mb-1.5">
                  <span>Capacity</span>
                  <span className="tabular-nums text-slate-900 normal-case tracking-normal">
                    {capacity.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-white/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-[width] duration-500 ease-out"
                    style={{ width: `${capacityBarPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.15em] text-slate-600 mb-1.5">
                  <span>Actual</span>
                  <span
                    className={`tabular-nums normal-case tracking-normal ${
                      overTourism ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {actual.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-white/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-500 ease-out ${
                      overTourism ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${actualBarPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Status banner */}
            <div
              className={`rounded-lg px-4 py-3 text-xs leading-relaxed border ${
                overTourism
                  ? 'bg-rose-500/25 border-rose-600/45 text-rose-900'
                  : 'bg-emerald-500/25 border-emerald-600/45 text-emerald-900'
              }`}
            >
              {overTourism ? (
                <>
                  <span className="font-semibold">
                    ⚠ Over capacity by {overflowPct}%.
                  </span>{' '}
                  Overtourism is occurring — pressure on residents,
                  environment, and infrastructure rises sharply.
                </>
              ) : (
                <>
                  <span className="font-semibold">✓ Within capacity.</span>{' '}
                  {headroomPct}% headroom remaining before pressure thresholds.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
