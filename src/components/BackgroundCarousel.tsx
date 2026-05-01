import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBackgroundCarousel } from '../hooks/useBackgroundCarousel';

const BG_INTERVAL_MS = 30_000;
const BG_FADE_MS = 2000;
const KENBURNS_VARIANTS = ['kenburns-a', 'kenburns-b', 'kenburns-c', 'kenburns-d'] as const;

interface BackgroundCarouselProps {
  /** Stable reference identifying which set of images this is (e.g. city.id).
   *  Used to reset the carousel when the user navigates between cities. */
  resetKey: string;
  images: string[];
}

/**
 * Layered cross-fade background gallery with macOS-style Ken Burns zoom.
 * Auto-advances every 30s; manual nav via dot indicators or side arrows
 * resets the timer.
 */
export default function BackgroundCarousel({ resetKey, images }: BackgroundCarouselProps) {
  const { index, cycle, goTo, next, prev } = useBackgroundCarousel(images, {
    intervalMs: BG_INTERVAL_MS,
  });

  return (
    <>
      {images.map((url, i) => (
        <div
          key={`${resetKey}-${i}-${cycle}`}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${url})`,
            opacity: i === index ? 1 : 0,
            transition: `opacity ${BG_FADE_MS}ms ease-out`,
            animation:
              i === index
                ? `${KENBURNS_VARIANTS[i % KENBURNS_VARIANTS.length]} ${BG_INTERVAL_MS + BG_FADE_MS}ms ease-out forwards`
                : 'none',
            willChange: 'opacity, transform',
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70 pointer-events-none" />

      <button
        onClick={prev}
        aria-label="Previous background"
        className="absolute z-20 left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white opacity-50 hover:opacity-100 transition"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next background"
        className="absolute z-20 right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white opacity-50 hover:opacity-100 transition"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

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
