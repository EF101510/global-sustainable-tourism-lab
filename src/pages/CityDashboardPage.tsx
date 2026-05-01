import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BarChart3, MessageSquare } from 'lucide-react';
import BackgroundCarousel from '../components/BackgroundCarousel';
import CarryingCapacityCalculator from '../components/CarryingCapacityCalculator';
import FloatingAIChat from '../components/FloatingAIChat';
import IssueCard from '../components/IssueCard';
import StudentBoard from '../components/StudentBoard';
import { CITIES } from '../data/cities';

export default function CityDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [showBoard, setShowBoard] = useState(false);

  const city = CITIES.find((c) => c.id === id);
  if (!city) return <Navigate to="/" replace />;

  return (
    // bg-slate-900 is a fallback shown until the carousel's images finish
    // loading, so we never flash a blank white screen during navigation.
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      <BackgroundCarousel resetKey={city.id} images={city.bg} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/', { state: { fromCity: true } })}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white border border-white/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Globe</span>
        </button>
        <button
          onClick={() => setShowBoard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 backdrop-blur-md rounded-lg text-white border border-white/20 transition"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">Student Board</span>
        </button>
      </div>

      {/* Main content — single column, scrollable, with a comfortable
          reading width. AI chat is now a floating widget, not inline. */}
      <div className="relative z-10 px-6 pb-6 h-[calc(100%-72px)] overflow-y-auto">
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
              {city.issues.map((issue, i) => (
                <IssueCard
                  key={i}
                  issue={issue}
                  expanded={expandedIssue === i}
                  onToggle={() => setExpandedIssue(expandedIssue === i ? null : i)}
                />
              ))}
            </div>
          </div>

          <div className="mt-8 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-cyan-300" />
              <h3 className="text-sm font-semibold text-white tracking-wide">
                CARRYING CAPACITY
              </h3>
            </div>
            <CarryingCapacityCalculator city={city} />
          </div>
        </div>
      </div>

      <FloatingAIChat city={city} />

      {showBoard && <StudentBoard city={city} onClose={() => setShowBoard(false)} />}
    </div>
  );
}
