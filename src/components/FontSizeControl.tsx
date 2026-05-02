import { useEffect, useState } from 'react';
import { Type } from 'lucide-react';

const STORAGE_KEY = 'app:fontSize';
// Multiplier applied to the document root font-size. Tailwind's text
// utilities are rem-based, so this resizes (almost) all text in the app
// proportionally. 1.0 = browser default 16px.
const STEPS = [
  0.85, 0.925, 1, 1.075, 1.15, 1.225, 1.3, 1.375, 1.45, 1.5,
] as const;
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
 * A−/A+ buttons that step through fixed font-size scales applied to the
 * document root. Choice persists to localStorage.
 *
 * IMPORTANT: every dimension here is hard-coded in pixels (inline style
 * or `text-[Npx]`) instead of rem-based Tailwind utilities. The control
 * itself drives the root font-size, so if its internals were rem-based
 * they would resize along with the page — and the +A button would drift
 * away from the cursor between clicks. Fixed pixels keep the buttons in
 * place no matter how many times the user steps the size.
 */
export default function FontSizeControl() {
  const [scale, setScale] = useState<number>(() => readStored());

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
    <div
      className="glass-button flex items-center text-white"
      style={{
        gap: 4,
        padding: '4px 8px',
        borderRadius: 8,
        fontSize: 14,
        lineHeight: 1.25,
      }}
      title={`Font size: ${Math.round(scale * 100)}%`}
    >
      <Type
        size={14}
        className="text-white/70"
        style={{ marginRight: 2 }}
        aria-hidden
      />
      <button
        onClick={dec}
        disabled={!canDec}
        aria-label="Decrease font size"
        className="leading-none hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition"
        style={{ padding: '2px 6px', fontSize: 12, borderRadius: 4 }}
      >
        A<span style={{ fontSize: 9, verticalAlign: 'super' }}>−</span>
      </button>
      <button
        onClick={inc}
        disabled={!canInc}
        aria-label="Increase font size"
        className="leading-none hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition"
        style={{ padding: '2px 6px', fontSize: 14, borderRadius: 4 }}
      >
        A<span style={{ fontSize: 10, verticalAlign: 'super' }}>+</span>
      </button>
    </div>
  );
}

/** Run once at app startup to apply the saved font size before first paint. */
export function initFontSize() {
  if (typeof window === 'undefined') return;
  applyToRoot(readStored());
}
