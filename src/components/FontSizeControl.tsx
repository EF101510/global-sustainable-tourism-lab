import { useEffect, useState } from 'react';
import { Type } from 'lucide-react';

const STORAGE_KEY = 'app:fontSize';
// Multipliers applied to the root html font-size (which Tailwind's rem-based
// text utilities follow). 1.0 = browser default 16px.
const STEPS = [0.875, 1, 1.125, 1.25] as const;
const DEFAULT_STEP = 1;

function readStored(): number {
  if (typeof window === 'undefined') return DEFAULT_STEP;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number(raw) : NaN;
  return STEPS.includes(n as (typeof STEPS)[number]) ? n : DEFAULT_STEP;
}

function applyToRoot(scale: number) {
  document.documentElement.style.fontSize = `${scale * 100}%`;
}

/**
 * A−/A+ buttons that scale the document root font-size. Tailwind's text
 * utilities are rem-based, so this resizes (almost) all text in the app
 * proportionally. Choice is persisted to localStorage so it survives
 * navigation and reloads.
 */
export default function FontSizeControl() {
  const [scale, setScale] = useState<number>(() => readStored());

  // Apply on mount and on every change.
  useEffect(() => {
    applyToRoot(scale);
    window.localStorage.setItem(STORAGE_KEY, String(scale));
  }, [scale]);

  const idx = STEPS.indexOf(scale as (typeof STEPS)[number]);
  const canDec = idx > 0;
  const canInc = idx >= 0 && idx < STEPS.length - 1;

  const dec = () => canDec && setScale(STEPS[idx - 1]);
  const inc = () => canInc && setScale(STEPS[idx + 1]);

  return (
    <div className="glass-button flex items-center gap-1 px-2 py-1 rounded-lg text-white">
      <Type className="w-3.5 h-3.5 text-white/70 mr-0.5" aria-hidden />
      <button
        onClick={dec}
        disabled={!canDec}
        aria-label="Decrease font size"
        className="px-1.5 py-0.5 text-xs leading-none rounded hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        A<span className="text-[9px] align-super">−</span>
      </button>
      <button
        onClick={inc}
        disabled={!canInc}
        aria-label="Increase font size"
        className="px-1.5 py-0.5 text-sm leading-none rounded hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        A<span className="text-[10px] align-super">+</span>
      </button>
    </div>
  );
}

/** Run once at app startup to apply the saved font size before first paint. */
export function initFontSize() {
  if (typeof window === 'undefined') return;
  applyToRoot(readStored());
}
