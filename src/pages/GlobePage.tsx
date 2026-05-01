import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Globe2 } from 'lucide-react';
import Globe, { type GlobeHoverState } from '../components/Globe';
import type { City } from '../types';

export default function GlobePage() {
  const navigate = useNavigate();
  const [hover, setHover] = useState<GlobeHoverState>({ city: null, x: 0, y: 0 });
  const [zoomingIn, setZoomingIn] = useState(false);

  const handleCitySelect = useCallback(
    (city: City) => {
      navigate(`/city/${city.id}`);
    },
    [navigate]
  );

  const hoveredCity = hover.city;

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <Globe
        onCitySelect={handleCitySelect}
        onHoverChange={setHover}
        onZoomingChange={setZoomingIn}
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

      {/* Hover intro card — frosted glass */}
      {hoveredCity && !zoomingIn && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: Math.min(hover.x + 20, window.innerWidth - 340),
            top: Math.min(hover.y + 20, window.innerHeight - 320),
          }}
        >
          <div
            className="
              w-80 overflow-hidden rounded-3xl
              bg-white/40 backdrop-blur-2xl backdrop-saturate-150
              border border-white/60
              ring-1 ring-inset ring-white/40
              shadow-[0_24px_60px_-15px_rgba(30,58,138,0.35)]
            "
          >
            {/* Accent bar */}
            <div className="h-[2px] bg-gradient-to-r from-blue-500/0 via-cyan-400 to-blue-500/0" />

            {/* Title block */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-500" />
                <span className="text-[10px] tracking-[0.22em] font-semibold text-blue-700/80 uppercase">
                  {hoveredCity.region}
                </span>
              </div>
              <h3 className="text-2xl font-light text-slate-900 leading-tight tracking-tight">
                {hoveredCity.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{hoveredCity.country}</p>
            </div>

            {/* Soft divider */}
            <div className="mx-6 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />

            {/* Intro */}
            <div className="px-6 pt-4 pb-3">
              <p className="text-[12.5px] text-slate-700/90 leading-relaxed">
                {hoveredCity.intro}
              </p>
            </div>

            {/* Issue chips */}
            <div className="px-6 pb-5 flex flex-wrap gap-1.5">
              {hoveredCity.issues.map((issue, i) => (
                <span
                  key={i}
                  className="
                    inline-flex items-center gap-1
                    text-[11px] font-medium text-slate-700
                    bg-white/55 backdrop-blur-sm
                    border border-white/70
                    px-2.5 py-1 rounded-full
                    shadow-[0_1px_2px_rgba(30,58,138,0.06)]
                  "
                >
                  <span>{issue.icon}</span>
                  <span>{issue.tag}</span>
                </span>
              ))}
            </div>

            {/* CTA footer */}
            <div className="px-6 py-3 bg-gradient-to-r from-blue-500/10 via-cyan-500/15 to-blue-500/10 border-t border-white/50">
              <p className="text-[11px] font-medium text-blue-700 flex items-center justify-center gap-1.5 tracking-wide">
                Click to explore
                <ArrowUpRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Black overlay during zoom-in transition */}
      <div
        className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-700 ease-out ${
          zoomingIn ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
