import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { BoardPost, City } from '../types';

const MAX_NICKNAME = 20;
const MAX_CONTENT = 500;

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function StudentBoard({
  city,
  onClose,
}: {
  city: City;
  onClose: () => void;
}) {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const storageKey = `board:${city.id}`;

  useEffect(() => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(storageKey);
      const list: BoardPost[] = raw ? JSON.parse(raw) : [];
      setPosts(list.sort((a, b) => b.time - a.time));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  const submit = () => {
    if (!nickname.trim() || !content.trim() || content.length > MAX_CONTENT) return;
    setSubmitting(true);
    const newPost: BoardPost = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      nickname: nickname.trim(),
      content: content.trim(),
      time: Date.now(),
    };
    const updated = [newPost, ...posts];
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setPosts(updated);
      setContent('');
    } catch {
      alert('Submission failed. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              💬 {city.name} · 24-Hour Smart Visitor Cap Plan
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Share your solution · Visible to students worldwide
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 border-b bg-blue-50/50">
          <div className="flex gap-2 mb-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, MAX_NICKNAME))}
              placeholder="Your nickname"
              className="w-32 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-400"
            />
            <span className="text-xs text-gray-400 self-center">
              {content.length}/{MAX_CONTENT}
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
            placeholder="Example: 7-10 AM resident-priority entry; afternoon visitor cap of 4,000..."
            className="w-full text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-400 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={submit}
              disabled={submitting || !nickname.trim() || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              {submitting ? 'Submitting...' : 'Submit suggestion'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading && <p className="text-sm text-gray-400 text-center">Loading...</p>}
          {!loading && posts.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No posts yet — be the first to share a solution!
            </p>
          )}
          {posts.map((p) => (
            <div key={p.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">{p.nickname}</span>
                <span className="text-xs text-gray-400">{formatTime(p.time)}</span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {p.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
