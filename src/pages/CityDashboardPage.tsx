import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Maximize2,
  MessageSquare,
  Minimize2,
} from 'lucide-react';
import BackgroundCarousel from '../components/BackgroundCarousel';
import CarryingCapacityCalculator from '../components/CarryingCapacityCalculator';
import CityOverview from '../components/CityOverview';
import FloatingAIChat from '../components/FloatingAIChat';
import FontSizeControl from '../components/FontSizeControl';
import IssueCard from '../components/IssueCard';
import StudentBoard from '../components/StudentBoard';
import { CITIES } from '../data/cities';

const ENTRY_FADE_DURATION_MS = 700;

export default function CityDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // A single key tracks which card is expanded across the whole panel —
  // issues and the carrying-capacity card share this state, so opening any
  // one of them collapses whichever was open before.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  // Preview mode: hides all chrome (top bar, panels, AI bubble) so the
  // background imagery and the carousel dots are the only thing on screen.
  const [previewMode, setPreviewMode] = useState(false);

  // Did we arrive via a globe-marker click? If so, render an opaque black
  // overlay on first paint and fade it out — this picks up smoothly from
  // the black overlay GlobePage just animated up during the zoom-in, so
  // the user sees a continuous black-to-photo transition instead of a
  // hard cut. Captured once at mount via lazy state init.
  const [fadingFromBlack, setFadingFromBlack] = useState<boolean>(() =>
    Boolean(
      (location.state as { fromGlobe?: boolean } | null)?.fromGlobe
    )
  );

  // Trigger the fade on the next frame so the initial paint at opacity-100
  // is preserved before transitioning to 0.
  useEffect(() => {
    if (!fadingFromBlack) return;
    const t = window.setTimeout(() => setFadingFromBlack(false), 16);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        dragEnabled={previewMode}
      />

      {/* Top bar — hidden in preview mode. NB: do NOT animate opacity here.
          A wrapper with opacity < 1 (or transform / filter / will-change)
          establishes a stacking context, which prevents the inner
          glass-button's `backdrop-filter` from seeing the carousel photo
          underneath. We toggle display instead of opacity for an instant
          show/hide that keeps the blur correct from the first frame.

          Padding is hard-coded in px (instead of `px-6 py-4`) because
          this row hosts the FontSizeControl — if the row's padding scaled
          with the root font-size, the buttons would shift between clicks
          and the user couldn't tap +A repeatedly without re-aiming. */}
      <div
        className={`relative z-10 flex items-center justify-between ${
          previewMode ? 'hidden' : ''
        }`}
        style={{ padding: '16px 24px' }}
      >
        <button
          onClick={() => navigate('/', { state: { fromCity: true } })}
          className="glass-button chrome-button text-white"
        >
          <ArrowLeft size={16} />
          <span>Back to Globe</span>
        </button>
        <div className="flex items-center" style={{ gap: 8 }}>
          <FontSizeControl />
          <button
            onClick={() => setPreviewMode(true)}
            className="glass-button chrome-button text-white"
          >
            <Maximize2 size={16} />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setShowBoard(true)}
            className="glass-button chrome-button text-white"
          >
            <MessageSquare size={16} />
            <span>Student Board</span>
          </button>
        </div>
      </div>

      {/* Main content — hidden in preview mode. Same reason as the top bar
          above: opacity-fading this wrapper would create a stacking context
          while opacity < 1, breaking the inner glass-card cards'
          backdrop-filter. Use display toggle instead. */}
      <div
        className={`relative z-10 px-6 pb-6 h-[calc(100%-72px)] overflow-y-auto ${
          previewMode ? 'hidden' : ''
        }`}
      >
        <div className="max-w-3xl">
          <p className="text-xs tracking-widest text-cyan-300 mb-1">
            {city.region.toUpperCase()}
          </p>
          <h2 className="text-5xl font-light text-white">{city.name}</h2>
          <p className="text-lg text-white/80 mt-1">{city.country}</p>
          <p className="text-sm text-white/70 mt-3 leading-relaxed">{city.intro}</p>

          {/* Overview card — rich multi-section context (features /
              environment / geography / products / economy). Shares the
              global single-card-open mutex with the issue & capacity
              cards below. */}
          <div className="mt-6">
            <CityOverview
              city={city}
              expanded={expandedKey === 'overview'}
              onToggle={() => toggle('overview')}
            />
          </div>

          <div className="mt-6">
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
        className={`glass-button chrome-button fixed top-4 right-4 z-30 text-white transition-opacity duration-300 ${
          previewMode ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Minimize2 size={16} />
        <span>Exit Preview</span>
      </button>

      {showBoard && <StudentBoard city={city} onClose={() => setShowBoard(false)} />}

      {/* Entry fade — covers everything in opaque black on first paint
          when we arrived from the globe (state.fromGlobe), then fades to
          0 over ENTRY_FADE_DURATION_MS so the user sees a smooth
          black-to-photo transition that picks up where the globe's
          zoom-in overlay left off. `pointer-events-none` keeps it
          click-through once invisible. */}
      <div
        className="absolute inset-0 z-[60] bg-black pointer-events-none"
        style={{
          opacity: fadingFromBlack ? 1 : 0,
          transition: `opacity ${ENTRY_FADE_DURATION_MS}ms ease-out`,
        }}
      />
    </div>
  );
}
