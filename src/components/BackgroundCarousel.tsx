import { useBackgroundCarousel } from '../hooks/useBackgroundCarousel';

const BG_INTERVAL_MS = 30_000;
const BG_FADE_MS = 2000;
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
 * Auto-advances every 30s; manual nav via dot indicators resets the timer.
 */
export default function BackgroundCarousel({
  resetKey,
  images,
  showOverlay = true,
}: BackgroundCarouselProps) {
  const { index, cycle, goTo } = useBackgroundCarousel(images, {
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
      <div
        className={`absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70 pointer-events-none transition-opacity duration-500 ${
          showOverlay ? 'opacity-100' : 'opacity-0'
        }`}
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
