import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2 } from 'lucide-react';
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

      {/* Hover intro card */}
      {hoveredCity && !zoomingIn && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: Math.min(hover.x + 20, window.innerWidth - 312),
            top: Math.min(hover.y + 20, window.innerHeight - 280),
          }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-blue-100 overflow-hidden w-72">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-700 to-cyan-600">
              <p className="text-[10px] text-cyan-100/90 tracking-[0.2em] font-medium">
                {hoveredCity.region.toUpperCase()}
              </p>
              <p className="text-lg font-semibold text-white leading-tight mt-0.5">
                {hoveredCity.name}
              </p>
              <p className="text-xs text-cyan-100 mt-0.5">{hoveredCity.country}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-700 leading-relaxed mb-3">
                {hoveredCity.intro}
              </p>
              <div className="flex flex-wrap gap-1">
                {hoveredCity.issues.map((issue, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100"
                  >
                    {issue.icon} {issue.tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-[11px] text-blue-600 text-center border-t border-blue-100">
              Click to explore →
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
