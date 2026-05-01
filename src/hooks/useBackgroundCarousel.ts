import { useEffect, useState } from 'react';

export interface UseBackgroundCarouselOptions {
  intervalMs?: number;
}

export interface UseBackgroundCarousel {
  index: number;
  /** Increments on every transition (manual or auto). Use as part of an
   *  element key to restart CSS animations on switch. */
  cycle: number;
  goTo: (i: number) => void;
  next: () => void;
  prev: () => void;
}

/**
 * Drives the cross-fade background carousel: holds the active image index,
 * auto-advances every `intervalMs` (default 30s), and exposes manual
 * navigation. Resets when the `images` reference changes (e.g. new city).
 */
export function useBackgroundCarousel(
  images: string[],
  { intervalMs = 30_000 }: UseBackgroundCarouselOptions = {}
): UseBackgroundCarousel {
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);

  // Reset on images change (different city)
  useEffect(() => {
    setIndex(0);
    setCycle(0);
  }, [images]);

  // Auto-advance; effect re-runs on every index change so manual nav also
  // resets the timer.
  useEffect(() => {
    if (images.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
      setCycle((c) => c + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [images, index, intervalMs]);

  const goTo = (i: number) => {
    if (images.length === 0) return;
    const next = ((i % images.length) + images.length) % images.length;
    setIndex(next);
    setCycle((c) => c + 1);
  };

  return {
    index,
    cycle,
    goTo,
    next: () => goTo(index + 1),
    prev: () => goTo(index - 1),
  };
}
