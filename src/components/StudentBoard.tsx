import { useEffect, useState, useCallback, useMemo } from 'react';
import { Pencil, RefreshCw, Trash2, X } from 'lucide-react';
import type { BoardPost, City } from '../types';

const MAX_NICKNAME = 20;
const MAX_CLASS = 30;
const MAX_CONTENT = 500;

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Per-city map of postId → editToken. The token is returned exactly
 * once when a post is created, and only this client keeps it. If the
 * user clears localStorage they lose the ability to edit their own
 * past posts — that's expected: this is a classroom tool, not auth.
 */
function tokenStorageKey(cityId: string): string {
  return `board:editTokens:${cityId}`;
}

function readTokens(cityId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(tokenStorageKey(cityId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeTokens(cityId: string, tokens: Record<string, string>): void {
  try {
    localStorage.setItem(tokenStorageKey(cityId), JSON.stringify(tokens));
  } catch {
    // Storage full / disabled — silently degrade. The post still
    // exists server-side; the user just can't edit it from this
    // browser.
  }
}

/**
 * App-wide identity for the board. Once a student posts for the first
 * time, we pin their (nickname, studentClass) here and lock the form
 * so subsequent posts use the same identity. They can reset via
 * "Change identity", which also clears all editTokens (the new
 * identity has no claim on the previous student's posts).
 *
 * Same trust model as editToken: client-only, honor system. A
 * determined student can wipe localStorage to start over — acceptable
 * for a classroom tool.
 */
const IDENTITY_KEY = 'board:identity';
const TOKEN_KEY_PREFIX = 'board:editTokens:';

interface BoardIdentity {
  nickname: string;
  studentClass: string;
  lockedAt: number;
}

function readIdentity(): BoardIdentity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.nickname === 'string' &&
      typeof parsed.studentClass === 'string' &&
      parsed.nickname.trim() &&
      parsed.studentClass.trim()
    ) {
      return {
        nickname: parsed.nickname,
        studentClass: parsed.studentClass,
        lockedAt: Number(parsed.lockedAt) || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function writeIdentity(id: BoardIdentity): void {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
  } catch {
    // ignore
  }
}

function clearIdentityAndTokens(): void {
  try {
    localStorage.removeItem(IDENTITY_KEY);
    // Also wipe every per-city editTokens map so the new identity
    // can't claim posts that the previous identity made.
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(TOKEN_KEY_PREFIX)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error === 'string') return body.error;
    return `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function fetchPosts(cityId: string): Promise<BoardPost[]> {
  const res = await fetch(`/api/board/${cityId}`);
  if (!res.ok) throw new Error(await readError(res));
  const data = (await res.json()) as { posts?: BoardPost[] };
  return data.posts ?? [];
}

async function submitPost(
  cityId: string,
  input: { nickname: string; studentClass: string; content: string }
): Promise<{ post: BoardPost; editToken: string }> {
  const res = await fetch(`/api/board/${cityId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as { post: BoardPost; editToken: string };
}

async function patchPost(
  cityId: string,
  postId: string,
  input: { editToken: string; content: string }
): Promise<BoardPost> {
  const res = await fetch(`/api/board/${cityId}/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  const data = (await res.json()) as { post: BoardPost };
  return data.post;
}

async function deletePostRequest(
  cityId: string,
  postId: string,
  editToken: string
): Promise<void> {
  const res = await fetch(`/api/board/${cityId}/${postId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ editToken }),
  });
  if (!res.ok) throw new Error(await readError(res));
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
  const [studentClass, setStudentClass] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [identity, setIdentity] = useState<BoardIdentity | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setTokens(readTokens(city.id));
  }, [city.id]);

  // On mount: hydrate identity and pre-fill the locked fields.
  useEffect(() => {
    const id = readIdentity();
    if (id) {
      setIdentity(id);
      setNickname(id.nickname);
      setStudentClass(id.studentClass);
    }
  }, []);

  const identityLocked = identity !== null;

  const resetIdentity = () => {
    clearIdentityAndTokens();
    setIdentity(null);
    setTokens({});
    setNickname('');
    setStudentClass('');
    setConfirmReset(false);
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchPosts(city.id);
      setPosts(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [city.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = async () => {
    if (
      !nickname.trim() ||
      !studentClass.trim() ||
      !content.trim() ||
      content.length > MAX_CONTENT
    )
      return;
    setSubmitting(true);
    setError(null);
    try {
      const { post, editToken } = await submitPost(city.id, {
        nickname: nickname.trim(),
        studentClass: studentClass.trim(),
        content: content.trim(),
      });
      // Optimistically prepend the new post — KV is eventually
      // consistent so an immediate re-fetch may not see our own write
      // for ~30–60s. Local prepend avoids that gap.
      setPosts((prev) => [post, ...prev]);
      setTokens((prev) => {
        const next = { ...prev, [post.id]: editToken };
        writeTokens(city.id, next);
        return next;
      });
      // First successful submit pins this browser's identity.
      if (!identity) {
        const next: BoardIdentity = {
          nickname: post.nickname,
          studentClass: post.studentClass,
          lockedAt: Date.now(),
        };
        writeIdentity(next);
        setIdentity(next);
      }
      setContent('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm">
      <div className="glass-modal rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col text-white">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/15">
          <div>
            <h3 className="text-lg font-semibold text-white">
              💬 {city.name} · 24-Hour Smart Visitor Cap Plan
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              Share your solution · Visible to students worldwide
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh posts"
              className="p-2 hover:bg-white/15 rounded-lg disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 text-white/70 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/15 rounded-lg">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-b border-white/15 bg-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, MAX_NICKNAME))}
              placeholder="Nickname"
              readOnly={identityLocked}
              aria-readonly={identityLocked}
              title={identityLocked ? 'Locked. Use "Change identity" to reset.' : undefined}
              className={`w-full sm:w-32 text-sm rounded-lg px-3 py-2 border focus:outline-none placeholder:text-white/40 ${
                identityLocked
                  ? 'border-white/15 bg-white/5 text-white/60 cursor-not-allowed'
                  : 'border-white/20 bg-white/5 text-white focus:border-cyan-300'
              }`}
            />
            <input
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value.slice(0, MAX_CLASS))}
              placeholder="Class (e.g. 7-A)"
              readOnly={identityLocked}
              aria-readonly={identityLocked}
              title={identityLocked ? 'Locked. Use "Change identity" to reset.' : undefined}
              className={`w-full sm:w-40 text-sm rounded-lg px-3 py-2 border focus:outline-none placeholder:text-white/40 ${
                identityLocked
                  ? 'border-white/15 bg-white/5 text-white/60 cursor-not-allowed'
                  : 'border-white/20 bg-white/5 text-white focus:border-cyan-300'
              }`}
            />
            <span className="text-xs text-white/50 self-end sm:self-center sm:ml-auto">
              {content.length}/{MAX_CONTENT}
            </span>
          </div>
          {identityLocked && (
            <p className="text-[11px] text-white/60 -mt-1 mb-2">
              Posting as <span className="font-medium text-white/80">{identity?.nickname}</span>
              {' · '}
              {identity?.studentClass}
              {' · '}
              <button
                onClick={() => setConfirmReset(true)}
                className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
              >
                Change identity
              </button>
            </p>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
            placeholder="Example: 7-10 AM resident-priority entry; afternoon visitor cap of 4,000..."
            className="w-full text-sm rounded-lg px-3 py-2 border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-300 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={submit}
              disabled={
                submitting ||
                !nickname.trim() ||
                !studentClass.trim() ||
                !content.trim()
              }
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/40 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              {submitting ? 'Submitting...' : 'Submit suggestion'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-rose-200 bg-rose-500/15 border border-rose-300/30 rounded-md px-2 py-1">
              ⚠️ {error}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading && <p className="text-sm text-white/50 text-center">Loading...</p>}
          {!loading && posts.length === 0 && !error && (
            <p className="text-sm text-white/50 text-center py-8">
              No posts yet — be the first to share a solution!
            </p>
          )}
          {confirmReset && (
            <ConfirmDialog
              title="Change your identity?"
              body="Future posts will use a new name. Your existing posts keep the old name, and you won't be able to edit them from this browser anymore."
              confirmLabel="Change identity"
              onCancel={() => setConfirmReset(false)}
              onConfirm={resetIdentity}
            />
          )}
          {posts.map((p) =>
            editingId === p.id ? (
              <EditPostRow
                key={p.id}
                post={p}
                editToken={tokens[p.id] ?? ''}
                cityId={city.id}
                onCancel={() => setEditingId(null)}
                onSaved={(updated) => {
                  setPosts((prev) =>
                    prev.map((x) => (x.id === updated.id ? updated : x))
                  );
                  setEditingId(null);
                }}
              />
            ) : (
              <PostRow
                key={p.id}
                post={p}
                canManage={Boolean(tokens[p.id])}
                cityId={city.id}
                editToken={tokens[p.id] ?? ''}
                onEdit={() => setEditingId(p.id)}
                onDeleted={() => {
                  setPosts((prev) => prev.filter((x) => x.id !== p.id));
                  setTokens((prev) => {
                    if (!(p.id in prev)) return prev;
                    const next = { ...prev };
                    delete next[p.id];
                    writeTokens(city.id, next);
                    return next;
                  });
                }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function PostRow({
  post,
  canManage,
  cityId,
  editToken,
  onEdit,
  onDeleted,
}: {
  post: BoardPost;
  canManage: boolean;
  cityId: string;
  editToken: string;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doDelete = async () => {
    setDeleting(true);
    setErr(null);
    try {
      await deletePostRequest(cityId, post.id, editToken);
      setConfirmDelete(false);
      onDeleted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-white">{post.nickname}</span>
            {post.studentClass && (
              <span className="text-xs text-white/60">· {post.studentClass}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">{formatTime(post.time)}</span>
            {canManage && (
              <>
                <button
                  onClick={onEdit}
                  aria-label="Edit post"
                  className="p-1 rounded hover:bg-white/15 text-white/60 hover:text-white transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete post"
                  className="p-1 rounded hover:bg-rose-500/20 text-white/60 hover:text-rose-300 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
        {err && (
          <p className="mt-2 text-xs text-rose-200 bg-rose-500/15 border border-rose-300/30 rounded-md px-2 py-1">
            ⚠️ {err}
          </p>
        )}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="Delete this post?"
          body="This will permanently remove your post for everyone. This cannot be undone."
          confirmLabel={deleting ? 'Deleting...' : 'Delete'}
          onCancel={() => (deleting ? undefined : setConfirmDelete(false))}
          onConfirm={() => {
            if (!deleting) doDelete();
          }}
        />
      )}
    </>
  );
}

function EditPostRow({
  post,
  editToken,
  cityId,
  onCancel,
  onSaved,
}: {
  post: BoardPost;
  editToken: string;
  cityId: string;
  onCancel: () => void;
  onSaved: (updated: BoardPost) => void;
}) {
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dirty = useMemo(
    () => content.trim() !== post.content,
    [content, post.content]
  );

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const updated = await patchPost(cityId, post.id, {
        editToken,
        content: content.trim(),
      });
      onSaved(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-cyan-500/15 rounded-lg p-4 border border-cyan-300/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-white">{post.nickname}</span>
          {post.studentClass && (
            <span className="text-xs text-white/60">· {post.studentClass}</span>
          )}
        </div>
        <span className="text-xs text-white/50">
          {content.length}/{MAX_CONTENT}
        </span>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
        className="w-full text-sm rounded-lg px-3 py-2 border border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-300 resize-none"
        rows={3}
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="text-sm text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/15 transition"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving || !dirty || !content.trim()}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/40 text-white text-sm px-4 py-1.5 rounded-lg transition"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {err && (
        <p className="mt-2 text-xs text-rose-200 bg-rose-500/15 border border-rose-300/30 rounded-md px-2 py-1">
          ⚠️ {err}
        </p>
      )}
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass-modal rounded-xl shadow-2xl w-full max-w-md p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-base font-semibold text-white">{title}</h4>
        <p className="mt-2 text-sm text-white/80 leading-relaxed">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/15 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-rose-500 hover:bg-rose-400 text-white text-sm px-4 py-1.5 rounded-lg transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
