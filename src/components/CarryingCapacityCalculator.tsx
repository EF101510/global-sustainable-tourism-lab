import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
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
      <div className="text-[10px] tracking-[0.15em] uppercase text-white/60 mb-1.5">
        {label}
      </div>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={`w-full bg-white/10 text-white text-sm rounded-md px-3 py-2 border tabular-nums focus:outline-none transition-colors ${
          accent
            ? 'border-cyan-300/40 focus:border-cyan-300/80'
            : 'border-white/20 focus:border-white/50'
        }`}
      />
    </label>
  );
}

/**
 * Interactive carrying-capacity calculator. Renders the spec's LaTeX formula
 *   C = (A × U_f) / R_t
 * with editable inputs seeded from per-city defaults. The "Estimate via AI"
 * button asks the backend chat proxy for fresh values.
 */
export default function CarryingCapacityCalculator({ city }: { city: City }) {
  const defaults = getCarryingCapacityDefaults(city.id);
  const [siteName, setSiteName] = useState(defaults.siteName);
  const [area, setArea] = useState(defaults.area);
  const [spacePerPerson, setSpacePerPerson] = useState(defaults.spacePerPerson);
  const [stayTime, setStayTime] = useState(defaults.stayTime);
  const [actual, setActual] = useState(defaults.actualVisitors);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // Reset to per-city defaults when navigating to a different city.
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
    } catch {
      setEstimateError(
        '⚠️ AI proxy unavailable. Set up /api/chat on the backend to enable live estimates.'
      );
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
    <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-xl p-5 space-y-5 text-white">
      {/* Site label + AI estimate button */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.15em] uppercase text-white/55">
            Focal site
          </div>
          <div className="text-sm font-medium text-white/90 mt-0.5 truncate">
            {siteName}
          </div>
        </div>
        <button
          onClick={handleEstimate}
          disabled={estimating}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:bg-white/5 disabled:cursor-not-allowed border border-cyan-300/40 disabled:border-white/15 rounded-md text-xs text-cyan-100 disabled:text-white/40 transition-colors"
        >
          <Sparkles
            className={`w-3.5 h-3.5 ${estimating ? 'animate-spin' : ''}`}
          />
          {estimating ? 'Estimating…' : 'Real-time estimate'}
        </button>
      </div>

      {/* Formula */}
      <div className="bg-white/5 border border-white/10 rounded-lg py-4 px-3 text-center">
        <Formula tex="C = \frac{A \times U_f}{R_t}" />
        <p className="text-[10.5px] text-white/55 mt-2 leading-relaxed max-w-md mx-auto">
          A = site area · U<sub>f</sub> = space per person · R<sub>t</sub> = average
          stay time. Overtourism occurs when actual visitors exceed C.
        </p>
      </div>

      {estimateError && (
        <div className="bg-amber-500/10 border border-amber-300/30 rounded-md px-3 py-2 text-[11px] text-amber-100/90">
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
      <div className="bg-cyan-500/15 border border-cyan-300/30 rounded-lg px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-[0.15em] uppercase text-cyan-100/70">
            Daily capacity
          </div>
          <div className="text-[10px] text-cyan-100/50 mt-0.5">C</div>
        </div>
        <span className="text-3xl font-light text-cyan-100 tabular-nums">
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
          <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.15em] text-white/55 mb-1.5">
            <span>Capacity</span>
            <span className="tabular-nums text-white/80 normal-case tracking-normal">
              {capacity.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-[width] duration-500 ease-out"
              style={{ width: `${capacityBarPct}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.15em] text-white/55 mb-1.5">
            <span>Actual</span>
            <span
              className={`tabular-nums normal-case tracking-normal ${
                overTourism ? 'text-rose-200' : 'text-emerald-200'
              }`}
            >
              {actual.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-[width] duration-500 ease-out ${
                overTourism ? 'bg-rose-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${actualBarPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status banner */}
      <div
        className={`rounded-lg px-4 py-3 text-xs leading-relaxed border backdrop-blur-sm ${
          overTourism
            ? 'bg-rose-500/15 border-rose-300/30 text-rose-50'
            : 'bg-emerald-500/15 border-emerald-300/30 text-emerald-50'
        }`}
      >
        {overTourism ? (
          <>
            <span className="font-semibold">⚠ Over capacity by {overflowPct}%.</span>{' '}
            Overtourism is occurring — pressure on residents, environment, and
            infrastructure rises sharply.
          </>
        ) : (
          <>
            <span className="font-semibold">✓ Within capacity.</span>{' '}
            {headroomPct}% headroom remaining before pressure thresholds.
          </>
        )}
      </div>
    </div>
  );
}
