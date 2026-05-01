import { useEffect, useRef, useState } from 'react';
import { useBackgroundCarousel } from '../hooks/useBackgroundCarousel';

const BG_INTERVAL_MS = 30_000;
// Crossfade duration: long enough to feel cinematic without dragging.
// ease-in-out gives a soft start AND soft end so neither image pops.
const BG_FADE_MS = 1800;
const KENBURNS_VARIANTS = ['kenburns-a', 'kenburns-b', 'kenburns-c', 'kenburns-d'] as const;

interface BackgroundCarouselProps {
  /** Stable reference identifying which set of images this is (e.g. city.id).
   *  Used to reset the carousel when the user navigates between cities. */
  resetKey: string;
  images: string[];
  /** Whether to render the dark gradient that improves text contrast on
   *  top of the photo. Hidden in preview mode for a clean image. */
  showOverlay?: boolean;
}

/**
 * Layered cross-fade background gallery with macOS-style Ken Burns zoom.
 *
 * Transition strategy: every image has its own persistent outer layer
 * that owns the opacity tween. Only the active layer is at opacity 1;
 * previous layers fade 1 -> 0 in parallel with the new one's 0 -> 1, all
 * over BG_FADE_MS with ease-in-out. Outer layers are never unmounted, so
 * React cannot destroy the outgoing image mid-fade. The inner Ken Burns
 * div re-mounts (via a per-layer activation counter as its key) only on
 * inactive -> active transitions, restarting the zoom on appearance
 * while leaving outgoing transforms untouched.
 *
 * Auto-advances every 30s; manual nav via dot indicators resets the timer.
 */
export default function BackgroundCarousel({
  resetKey,
  images,
  showOverlay = true,
}: BackgroundCarouselProps) {
  const { index, goTo } = useBackgroundCarousel(images, {
    intervalMs: BG_INTERVAL_MS,
  });

  // Preload images so a freshly-activated layer never flashes blank while
  // the browser fetches the JPG. We only need this once per image URL.
  useEffect(() => {
    images.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [images]);

  // Track per-layer activation generation. We bump a layer's number each
  // time it becomes the active index (inactive -> active edge), and use
  // that number as a React key on its inner Ken Burns div so the zoom
  // restarts on every appearance. We deliberately do NOT bump on
  // deactivation: keeping the same key on the outgoing layer means React
  // preserves its DOM node + running animation, so its current transform
  // stays put while opacity drains — no snap-back to scale(1).
  //
  // Activation order also gives us a recency-based z-index, so when the
  // index wraps (e.g. 3 -> 0) the new layer renders above the old one
  // instead of below it.
  const [activations, setActivations] = useState<number[]>(() =>
    images.map(() => 0)
  );
  const [activationOrder, setActivationOrder] = useState<number[]>(() =>
    images.map((_, i) => i)
  );
  const lastIndexRef = useRef(index);
  useEffect(() => {
    if (lastIndexRef.current === index) return;
    lastIndexRef.current = index;
    setActivations((prev) => {
      const next = [...prev];
      next[index] = (next[index] ?? 0) + 1;
      return next;
    });
    setActivationOrder((prev) => {
      // Move `index` to the end (most recent activation = highest z).
      const filtered = prev.filter((i) => i !== index);
      return [...filtered, index];
    });
  }, [index]);

  // Reset state when the image set changes (different city).
  useEffect(() => {
    setActivations(images.map(() => 0));
    setActivationOrder(images.map((_, i) => i));
    lastIndexRef.current = 0;
  }, [images, resetKey]);

  return (
    <>
      {images.map((url, i) => {
        const isActive = i === index;
        // Higher index in activationOrder = more recent = higher z.
        const z = activationOrder.indexOf(i);
        return (
          <div
            key={`${resetKey}-${i}`}
            className="absolute inset-0 overflow-hidden"
            style={{
              opacity: isActive ? 1 : 0,
              transition: `opacity ${BG_FADE_MS}ms ease-in-out`,
              zIndex: z,
              willChange: 'opacity',
            }}
          >
            {/* Inner layer carries the image + Ken Burns. The key is the
                per-layer activation counter, so each time this layer
                becomes active again React swaps in a fresh node and the
                zoom restarts cleanly. The key does NOT change on
                deactivation, so the outgoing layer keeps its current
                transform while opacity fades to 0 — no snap-back. */}
            <div
              key={`kb-${i}-${activations[i] ?? 0}`}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${url})`,
                animation: `${KENBURNS_VARIANTS[i % KENBURNS_VARIANTS.length]} ${BG_INTERVAL_MS + BG_FADE_MS}ms ease-out forwards`,
                willChange: 'transform',
              }}
            />
          </div>
        );
      })}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70 pointer-events-none transition-opacity duration-500 ${
          showOverlay ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: images.length }}
      />

      <div className="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Background ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </>
  );
}
