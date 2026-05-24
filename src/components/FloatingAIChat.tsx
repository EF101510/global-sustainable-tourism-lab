import { useEffect, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import AIChat from './AIChat';
import type { City } from '../types';
import { useScrollLock } from '../hooks/useScrollLock';

interface FloatingAIChatProps {
  city: City;
  /** When true, the entire widget fades out (used for the page's preview
   *  mode). Both bubble and panel honour this and become non-interactive. */
  hidden?: boolean;
}

/**
 * Bottom-right floating widget: shows a "Ask AI" bubble by default; click
 * to expand into the full chat panel. Resets to collapsed when the city
 * changes so each city starts with a clean conversation.
 */
export default function FloatingAIChat({ city, hidden = false }: FloatingAIChatProps) {
  const [open, setOpen] = useState(false);

  // On touch devices the open panel is effectively full-screen, so lock the
  // page behind it to stop drags leaking through (iOS scroll chaining). On
  // desktop the panel is a small floating window — leave page scroll alone.
  const [isTouch] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );
  useScrollLock(open && isTouch);

  // Auto-collapse when navigating to a different city.
  useEffect(() => {
    setOpen(false);
  }, [city.id]);

  return (
    <>
      {/* Collapsed bubble */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI chat"
        style={{ willChange: 'opacity, transform' }}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 origin-bottom-right transition-all duration-300 ease-out flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-white ring-1 ring-white/30 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-[0_10px_28px_-8px_rgba(8,145,178,0.55)] ${
          hidden
            ? 'opacity-0 scale-100 pointer-events-none'
            : open
            ? 'opacity-0 scale-50 pointer-events-none'
            : 'opacity-100 scale-100'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Ask AI</span>
      </button>

      {/* Expanded panel — mounted only when open. We deliberately render
          nothing rather than fading via opacity/transform/scale, because
          any of those create a stacking context on the wrapper. While
          such a stacking context exists, the inner glass-panel's
          `backdrop-filter` cannot see the dashboard photo behind the
          wrapper — the panel paints with no blur and "snaps" to frosted
          only when the animation finishes. Skipping the panel animation
          (the bubble still fades) avoids that visible re-frost. */}
      {!hidden && open && (
        <div className="fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 z-40 sm:w-[560px] sm:max-w-[calc(100vw-3rem)] h-[calc(100dvh-1.5rem)] sm:h-[760px] sm:max-h-[90dvh]">
          <div className="relative w-full h-full">
            <AIChat city={city} />
            <button
              onClick={() => setOpen(false)}
              aria-label="Collapse AI chat"
              className="absolute top-2.5 right-3 z-10 p-1 hover:bg-white/15 rounded transition"
            >
              <ChevronDown className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
