import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Globe2, Pause, Play } from 'lucide-react';
import Globe, { type GlobeHoverState } from '../components/Globe';
import { CITIES } from '../data/cities';
import { getFlagUrl } from '../lib/country-flags';
import { preloadImages } from '../lib/preload';
import type { City } from '../types';

const ZOOM_OUT_DURATION_MS = 600;
const ZOOM_OUT_START_Z = 3.5;

function formatCoord(lat: number, lng: number) {
  const latStr = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(1)}°${lng >= 0 ? 'E' : 'W'}`;
  return `${latStr} · ${lngStr}`;
}

export default function GlobePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hover, setHover] = useState<GlobeHoverState>({ city: null, x: 0, y: 0 });
  const [zoomingIn, setZoomingIn] = useState(false);
  const [rotationPaused, setRotationPaused] = useState(false);

  // Captured once at mount: did we arrive here via the dashboard's Back button?
  const [initialCameraZ] = useState<number | undefined>(() =>
    (location.state as { fromCity?: boolean } | null)?.fromCity
      ? ZOOM_OUT_START_Z
      : undefined
  );
  const [zoomingOut, setZoomingOut] = useState(initialCameraZ !== undefined);

  // Trigger the overlay's opacity transition on the next frame so the
  // initial paint at opacity-100 is preserved before fading to 0.
  useEffect(() => {
    if (!zoomingOut) return;
    const t = window.setTimeout(() => setZoomingOut(false), 16);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Idle prefetch: as soon as the globe is interactive, quietly load the
  // first background image of every city so a click without hover still
  // paints fast. Subsequent images per city are pulled in on hover.
  useEffect(() => {
    const firstImages = CITIES.map((c) => c.bg[0]).filter(Boolean);
    // requestIdleCallback isn't available in Safari; cast through `unknown`
    // so we can feature-detect rather than rely on the lib.dom typing.
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (w.requestIdleCallback) {
      const handle = w.requestIdleCallback(
        () => preloadImages(firstImages),
        { timeout: 2500 }
      );
      return () => w.cancelIdleCallback?.(handle);
    }
    const handle = window.setTimeout(() => preloadImages(firstImages), 1500);
    return () => window.clearTimeout(handle);
  }, []);

  // Preload the dashboard backgrounds on hover so the carousel paints
  // instantly when the user clicks through. Belt-and-suspenders preload also
  // fires at click time in case they click without hovering first.
  const handleHoverChange = useCallback((state: GlobeHoverState) => {
    setHover(state);
    if (state.city) preloadImages(state.city.bg);
  }, []);

  const handleCitySelect = useCallback(
    (city: City) => {
      preloadImages(city.bg);
      // `fromGlobe` lets the dashboard fade in from black, mirroring the
      // black overlay we just animated up during the zoom-in.
      navigate(`/city/${city.id}`, { state: { fromGlobe: true } });
    },
    [navigate]
  );

  const hoveredCity = hover.city;

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <Globe
        onCitySelect={handleCitySelect}
        onHoverChange={handleHoverChange}
        onZoomingChange={setZoomingIn}
        initialCameraZ={initialCameraZ}
        rotationPaused={rotationPaused}
      />

      {/* Header */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 pointer-events-none transition-opacity duration-500 ${
          zoomingIn ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe2 className="w-7 h-7 text-blue-700" />
            <div>
              <h1 className="text-xl font-light tracking-wide text-blue-900">
                Global Sustainable Tourism <span className="font-semibold">AI Lab</span>
              </h1>
              <p className="text-xs text-blue-600/70 mt-0.5">
                Explore global sustainable tourism challenges
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700 font-medium">25 Cities</p>
            <p className="text-xs text-blue-500/70">Click a marker · Drag to rotate</p>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div
        className={`absolute bottom-6 left-0 right-0 text-center pointer-events-none transition-opacity duration-500 ${
          zoomingIn ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <p className="text-xs text-blue-500/60 tracking-widest">
          DRAG TO ROTATE · SCROLL TO ZOOM · CLICK A POINT
        </p>
      </div>

      {/* Pause / resume the auto-spin. Bottom-right floating glass button.
          Hidden during zoom-in so it doesn't sit over the black overlay. */}
      <button
        onClick={() => setRotationPaused((p) => !p)}
        aria-label={rotationPaused ? 'Resume rotation' : 'Pause rotation'}
        className={`absolute bottom-5 right-5 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-white/70 hover:bg-white/85 backdrop-blur-md border border-white/60 text-blue-700 shadow-[0_8px_20px_-8px_rgba(30,58,138,0.35)] transition ${
          zoomingIn ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {rotationPaused ? (
          <Play className="w-4 h-4" fill="currentColor" />
        ) : (
          <Pause className="w-4 h-4" fill="currentColor" />
        )}
        <span className="text-xs font-medium">
          {rotationPaused ? 'Resume' : 'Pause'}
        </span>
      </button>

      {/* Hover intro card — frosted glass */}
      {hoveredCity && !zoomingIn && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: Math.min(hover.x + 20, window.innerWidth - 288),
            top: Math.min(hover.y + 20, window.innerHeight - 280),
          }}
        >
          <div
            className="
              w-64 overflow-hidden rounded-2xl
              bg-white/20 backdrop-blur-2xl backdrop-saturate-150
              border border-white/40
              ring-1 ring-inset ring-white/30
              shadow-[0_16px_40px_-12px_rgba(30,58,138,0.28)]
            "
          >
            {/* Accent bar */}
            <div className="h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/80 to-cyan-400/0" />

            {/* Title block */}
            <div className="px-4 pt-3.5 pb-3.5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="inline-block h-1 w-1 rounded-full bg-cyan-500" />
                  <span className="text-[9px] tracking-[0.22em] font-semibold text-blue-700/70 uppercase">
                    {hoveredCity.region}
                  </span>
                </div>
                {getFlagUrl(hoveredCity.country) && (
                  <img
                    src={getFlagUrl(hoveredCity.country)}
                    alt=""
                    className="w-7 h-[18px] rounded-sm object-cover ring-1 ring-white/60 shadow-[0_1px_3px_rgba(15,23,42,0.15)]"
                  />
                )}
              </div>
              <h3 className="text-xl font-light text-slate-900 leading-[1.15] tracking-tight">
                {hoveredCity.name}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-slate-500/90">
                <span className="font-medium text-slate-600/90">
                  {hoveredCity.country}
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-[10px] text-slate-500/70 tabular-nums">
                  {formatCoord(hoveredCity.lat, hoveredCity.lng)}
                </span>
              </div>
            </div>

            {/* Soft divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            {/* Intro */}
            <div className="px-4 pt-2.5 pb-4">
              <p className="text-[11.5px] text-slate-700/85 leading-relaxed">
                {hoveredCity.intro}
              </p>
            </div>

            {/* Issue chips — hidden for now, kept for future re-enable */}
            {/*
            <div className="px-4 pb-4 flex flex-wrap gap-1">
              {hoveredCity.issues.map((issue, i) => (
                <span
                  key={i}
                  className="
                    inline-flex items-center gap-0.5
                    text-[10px] font-medium text-slate-700/85
                    bg-white/25 backdrop-blur-sm
                    border border-white/40
                    px-2 py-0.5 rounded-full
                  "
                >
                  <span>{issue.icon}</span>
                  <span>{issue.tag}</span>
                </span>
              ))}
            </div>
            */}

            {/* CTA footer */}
            <div className="px-4 py-2 bg-gradient-to-r from-blue-500/5 via-cyan-500/10 to-blue-500/5 border-t border-white/30">
              <p className="text-[10px] font-medium text-blue-700/90 flex items-center justify-center gap-1 tracking-wide">
                Click to explore
                <ArrowUpRight className="w-3 h-3" />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Black overlay during zoom-in transition (clicking a city) */}
      <div
        className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-700 ease-out ${
          zoomingIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Black overlay during zoom-out transition (returning from a city).
          Initially opaque on first paint, then fades as the camera pulls back. */}
      {initialCameraZ !== undefined && (
        <div
          className={`absolute inset-0 bg-black pointer-events-none ease-out ${
            zoomingOut ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transition: `opacity ${ZOOM_OUT_DURATION_MS}ms ease-out` }}
        />
      )}
    </div>
  );
}
