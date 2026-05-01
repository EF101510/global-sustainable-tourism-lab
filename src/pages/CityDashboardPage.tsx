import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, MessageSquare } from 'lucide-react';
import AIChat from '../components/AIChat';
import BackgroundCarousel from '../components/BackgroundCarousel';
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
    <div className="relative w-full h-full overflow-hidden">
      <BackgroundCarousel resetKey={city.id} images={city.bg} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/')}
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

      {/* Main content */}
      <div className="relative z-10 px-6 pb-6 grid grid-cols-12 gap-6 h-[calc(100%-72px)]">
        <div className="col-span-7 flex flex-col gap-4 overflow-y-auto pr-2">
          <div>
            <p className="text-xs tracking-widest text-cyan-300 mb-1">
              {city.region.toUpperCase()}
            </p>
            <h2 className="text-5xl font-light text-white">{city.name}</h2>
            <p className="text-lg text-white/80 mt-1">{city.country}</p>
            <p className="text-sm text-white/70 mt-3 max-w-xl leading-relaxed">
              {city.intro}
            </p>
          </div>

          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <h3 className="text-sm font-semibold text-white tracking-wide">
                CORE CHALLENGES
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
        </div>

        <div className="col-span-5">
          <AIChat city={city} />
        </div>
      </div>

      {showBoard && <StudentBoard city={city} onClose={() => setShowBoard(false)} />}
    </div>
  );
}
