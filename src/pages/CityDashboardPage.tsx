import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Maximize2,
  MessageSquare,
  Minimize2,
} from 'lucide-react';
import BackgroundCarousel from '../components/BackgroundCarousel';
import CarryingCapacityCalculator from '../components/CarryingCapacityCalculator';
import FloatingAIChat from '../components/FloatingAIChat';
import IssueCard from '../components/IssueCard';
import StudentBoard from '../components/StudentBoard';
import { CITIES } from '../data/cities';

export default function CityDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // A single key tracks which card is expanded across the whole panel —
  // issues and the carrying-capacity card share this state, so opening any
  // one of them collapses whichever was open before.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  // Preview mode: hides all chrome (top bar, panels, AI bubble) so the
  // background imagery and the carousel dots are the only thing on screen.
  const [previewMode, setPreviewMode] = useState(false);

  // Reset expansion + preview state when navigating to a different city.
  useEffect(() => {
    setExpandedKey(null);
    setPreviewMode(false);
  }, [id]);

  const toggle = (key: string) =>
    setExpandedKey((prev) => (prev === key ? null : key));

  const city = CITIES.find((c) => c.id === id);
  if (!city) return <Navigate to="/" replace />;

  return (
    // bg-slate-900 is a fallback shown until the carousel's images finish
    // loading, so we never flash a blank white screen during navigation.
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      <BackgroundCarousel
        resetKey={city.id}
        images={city.bg}
        showOverlay={!previewMode}
      />

      {/* Top bar — fades out in preview mode so only the photo is visible.
          `translateZ(0)` + `will-change: opacity` keep this on its own GPU
          layer so the inner backdrop-blur buttons don't re-rasterise when
          opacity transitions (which used to cause a one-frame flash). */}
      <div
        className={`relative z-10 flex items-center justify-between px-6 py-4 transition-opacity duration-500 ${
          previewMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
      >
        <button
          onClick={() => navigate('/', { state: { fromCity: true } })}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/55 backdrop-blur-3xl backdrop-saturate-[180%] rounded-lg text-white border border-white/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Globe</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/55 backdrop-blur-3xl backdrop-saturate-[180%] rounded-lg text-white border border-white/20 transition"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="text-sm">Preview</span>
          </button>
          <button
            onClick={() => setShowBoard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 backdrop-blur-3xl backdrop-saturate-[180%] rounded-lg text-white border border-white/25 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Student Board</span>
          </button>
        </div>
      </div>

      {/* Main content — fades out in preview mode. Same GPU-layer hint as
          the top bar so the backdrop-blur cards inside transition cleanly. */}
      <div
        className={`relative z-10 px-6 pb-6 h-[calc(100%-72px)] overflow-y-auto transition-opacity duration-500 ${
          previewMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
      >
        <div className="max-w-2xl">
          <p className="text-xs tracking-widest text-cyan-300 mb-1">
            {city.region.toUpperCase()}
          </p>
          <h2 className="text-5xl font-light text-white">{city.name}</h2>
          <p className="text-lg text-white/80 mt-1">{city.country}</p>
          <p className="text-sm text-white/70 mt-3 leading-relaxed">{city.intro}</p>

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <h3 className="text-sm font-semibold text-white tracking-wide">
                CORE CHALLENGES
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {city.issues.map((issue, i) => {
                const key = `issue-${i}`;
                return (
                  <IssueCard
                    key={i}
                    issue={issue}
                    expanded={expandedKey === key}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </div>

          {/* Carrying-capacity card — collapsible, same shape as issue
              cards above. Shares the global mutex so opening it collapses
              any open issue card and vice versa. */}
          <div className="mt-3 mb-4">
            <CarryingCapacityCalculator
              city={city}
              expanded={expandedKey === 'capacity'}
              onToggle={() => toggle('capacity')}
            />
          </div>
        </div>
      </div>

      {/* AI chat — pass `hidden` so the component itself fades its bubble
          and panel; we can't wrap it in a transformed div without breaking
          the inner fixed-position anchoring. */}
      <FloatingAIChat city={city} hidden={previewMode} />

      {/* Exit-preview floating button — appears at top-right in preview mode. */}
      <button
        onClick={() => setPreviewMode(false)}
        aria-label="Exit preview"
        className={`fixed top-4 right-4 z-30 flex items-center gap-2 px-4 py-2 bg-slate-700/40 hover:bg-slate-700/55 backdrop-blur-3xl backdrop-saturate-[180%] rounded-lg text-white border border-white/20 transition ${
          previewMode ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Minimize2 className="w-4 h-4" />
        <span className="text-sm">Exit Preview</span>
      </button>

      {showBoard && <StudentBoard city={city} onClose={() => setShowBoard(false)} />}
    </div>
  );
}
