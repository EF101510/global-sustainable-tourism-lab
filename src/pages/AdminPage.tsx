import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Globe2,
  KeyRound,
  LogIn,
  LogOut,
  Pencil,
  RefreshCw,
  Search,
  Settings,
  Trash2,
} from 'lucide-react';
import { CITIES } from '../data/cities';
import type { BoardPost } from '../types';

interface AdminPost extends BoardPost {
  cityId: string;
}

interface Credentials {
  username: string;
  password: string;
}

const SESSION_KEY = 'admin:session';

function readSession(): Credentials | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.username === 'string' &&
      typeof parsed.password === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeSession(c: Credentials): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function authHeader(c: Credentials): string {
  return `Basic ${btoa(`${c.username}:${c.password}`)}`;
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

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const CITY_NAME_BY_ID = new Map(CITIES.map((c) => [c.id, c.name]));

export default function AdminPage() {
  const [creds, setCreds] = useState<Credentials | null>(() => readSession());
  const [usingDefaults, setUsingDefaults] = useState(false);

  if (!creds) {
    return (
      <LoginScreen
        onLogin={(c, defaults) => {
          writeSession(c);
          setCreds(c);
          setUsingDefaults(defaults);
        }}
      />
    );
  }

  return (
    <Dashboard
      creds={creds}
      usingDefaults={usingDefaults}
      onLogout={() => {
        clearSession();
        setCreds(null);
        setUsingDefaults(false);
      }}
      onCredsChange={(c) => {
        writeSession(c);
        setCreds(c);
        setUsingDefaults(false);
      }}
    />
  );
}

function LoginScreen({
  onLogin,
}: {
  onLogin: (c: Credentials, usingDefaults: boolean) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const data = (await res.json()) as { ok: true; usingDefaults: boolean };
      onLogin(
        { username: username.trim(), password },
        Boolean(data.usingDefaults)
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 p-6">
      <div className="flex items-center gap-3 mb-8 text-white">
        <Globe2 className="w-8 h-8 text-blue-400" />
        <div className="text-center">
          <h1 className="text-2xl font-light tracking-wide">
            Global Sustainable Tourism{' '}
            <span className="font-semibold">AI Lab</span>
          </h1>
          <p className="text-xs text-blue-300/80 mt-0.5">Teacher admin console</p>
        </div>
      </div>
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <KeyRound className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Admin Login</h2>
        </div>
        <label className="block text-xs text-gray-500 mb-1">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          className="w-full text-sm rounded-lg px-3 py-2 mb-3 border border-gray-200 focus:outline-none focus:border-blue-400"
        />
        <label className="block text-xs text-gray-500 mb-1">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="w-full text-sm rounded-lg px-3 py-2 mb-4 border border-gray-200 focus:outline-none focus:border-blue-400"
        />
        {err && (
          <p className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-2 py-1">
            ⚠️ {err}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || !username.trim() || !password}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          <LogIn className="w-4 h-4" />
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function Dashboard({
  creds,
  usingDefaults,
  onLogout,
  onCredsChange,
}: {
  creds: Credentials;
  usingDefaults: boolean;
  onLogout: () => void;
  onCredsChange: (c: Credentials) => void;
}) {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [confirmBatch, setConfirmBatch] = useState(false);
  const [confirmSingle, setConfirmSingle] = useState<AdminPost | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // 401 → kick back to login.
  const onAuthFailed = useCallback(() => {
    setError('Session expired. Please sign in again.');
    onLogout();
  }, [onLogout]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/posts', {
        headers: { Authorization: authHeader(creds) },
      });
      if (res.status === 401) {
        onAuthFailed();
        return;
      }
      if (!res.ok) throw new Error(await readError(res));
      const data = (await res.json()) as { posts: AdminPost[] };
      setPosts(data.posts);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [creds, onAuthFailed]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredPosts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (cityFilter && p.cityId !== cityFilter) return false;
      if (!needle) return true;
      return (
        p.nickname.toLowerCase().includes(needle) ||
        p.studentClass.toLowerCase().includes(needle) ||
        p.content.toLowerCase().includes(needle) ||
        (CITY_NAME_BY_ID.get(p.cityId)?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [posts, cityFilter, search]);

  const keyOf = (p: AdminPost) => `${p.cityId}:${p.id}`;

  const allFilteredSelected =
    filteredPosts.length > 0 &&
    filteredPosts.every((p) => selected.has(keyOf(p)));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredPosts.forEach((p) => next.delete(keyOf(p)));
      } else {
        filteredPosts.forEach((p) => next.add(keyOf(p)));
      }
      return next;
    });
  };

  const toggleOne = (p: AdminPost) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = keyOf(p);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const deleteOne = async (p: AdminPost) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/${p.cityId}/${p.id}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader(creds) },
      });
      if (res.status === 401) {
        onAuthFailed();
        return;
      }
      if (!res.ok) throw new Error(await readError(res));
      setPosts((prev) => prev.filter((x) => keyOf(x) !== keyOf(p)));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(keyOf(p));
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirmSingle(null);
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    setError(null);
    const targets = posts
      .filter((p) => selected.has(keyOf(p)))
      .map((p) => ({ cityId: p.cityId, postId: p.id }));
    try {
      const res = await fetch('/api/admin/posts/delete-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader(creds),
        },
        body: JSON.stringify({ targets }),
      });
      if (res.status === 401) {
        onAuthFailed();
        return;
      }
      if (!res.ok) throw new Error(await readError(res));
      const sel = selected;
      setPosts((prev) => prev.filter((x) => !sel.has(keyOf(x))));
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirmBatch(false);
    }
  };

  const updatePost = async (
    p: AdminPost,
    body: { nickname?: string; studentClass?: string; content?: string }
  ) => {
    const res = await fetch(`/api/admin/posts/${p.cityId}/${p.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(creds),
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      onAuthFailed();
      throw new Error('Session expired');
    }
    if (!res.ok) throw new Error(await readError(res));
    const data = (await res.json()) as { post: BoardPost };
    setPosts((prev) =>
      prev.map((x) =>
        keyOf(x) === keyOf(p) ? { ...data.post, cityId: p.cityId } : x
      )
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-100">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Student Board · Admin
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Signed in as <span className="font-medium">{creds.username}</span>
              {usingDefaults && (
                <span className="ml-2 inline-block bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded">
                  using defaults — please change
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh"
              className="p-2 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 border border-gray-200"
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </header>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-200">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nickname / class / content / city"
                className="w-full text-sm rounded-lg pl-9 pr-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-400"
              />
            </div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">All cities</option>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setConfirmBatch(true)}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white"
            >
              <Trash2 className="w-4 h-4" />
              Delete selected ({selected.size})
            </button>
          </div>

          {error && (
            <div className="px-4 py-2 text-xs text-rose-600 bg-rose-50 border-b border-rose-200">
              ⚠️ {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3 py-2 text-left">City</th>
                  <th className="px-3 py-2 text-left">Nickname</th>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Content</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && filteredPosts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                      {posts.length === 0
                        ? 'No posts yet.'
                        : 'No posts match your filters.'}
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredPosts.map((p) => {
                    const k = keyOf(p);
                    const isEditing = editingKey === k;
                    return (
                      <AdminRow
                        key={k}
                        post={p}
                        cityName={CITY_NAME_BY_ID.get(p.cityId) ?? p.cityId}
                        selected={selected.has(k)}
                        editing={isEditing}
                        onToggle={() => toggleOne(p)}
                        onEdit={() => setEditingKey(k)}
                        onCancelEdit={() => setEditingKey(null)}
                        onSave={async (body) => {
                          await updatePost(p, body);
                          setEditingKey(null);
                        }}
                        onDelete={() => setConfirmSingle(p)}
                      />
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
            Showing {filteredPosts.length} of {posts.length} posts
          </div>
        </div>
      </div>

      {confirmBatch && (
        <ConfirmDialog
          title={`Delete ${selected.size} posts?`}
          body="This will permanently remove the selected posts for everyone. This cannot be undone."
          confirmLabel="Delete all"
          onCancel={() => setConfirmBatch(false)}
          onConfirm={deleteSelected}
        />
      )}

      {confirmSingle && (
        <ConfirmDialog
          title="Delete this post?"
          body={`From ${CITY_NAME_BY_ID.get(confirmSingle.cityId) ?? confirmSingle.cityId} · ${confirmSingle.nickname}. This cannot be undone.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmSingle(null)}
          onConfirm={() => deleteOne(confirmSingle)}
        />
      )}

      {showSettings && (
        <SettingsDialog
          creds={creds}
          onClose={() => setShowSettings(false)}
          onSaved={(c) => {
            onCredsChange(c);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}

function AdminRow({
  post,
  cityName,
  selected,
  editing,
  onToggle,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: {
  post: AdminPost;
  cityName: string;
  selected: boolean;
  editing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (body: {
    nickname: string;
    studentClass: string;
    content: string;
  }) => Promise<void>;
  onDelete: () => void;
}) {
  const [nickname, setNickname] = useState(post.nickname);
  const [studentClass, setStudentClass] = useState(post.studentClass);
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setNickname(post.nickname);
      setStudentClass(post.studentClass);
      setContent(post.content);
      setErr(null);
    }
  }, [editing, post]);

  const save = async () => {
    if (!nickname.trim() || !studentClass.trim() || !content.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        nickname: nickname.trim(),
        studentClass: studentClass.trim(),
        content: content.trim(),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <tr className="border-t border-gray-100 bg-blue-50/50">
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2 text-gray-600 align-top">{cityName}</td>
        <td className="px-3 py-2 align-top">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 20))}
            className="w-full text-sm rounded-md px-2 py-1 border border-gray-300 bg-white"
          />
        </td>
        <td className="px-3 py-2 align-top">
          <input
            value={studentClass}
            onChange={(e) => setStudentClass(e.target.value.slice(0, 30))}
            className="w-full text-sm rounded-md px-2 py-1 border border-gray-300 bg-white"
          />
        </td>
        <td className="px-3 py-2 align-top" colSpan={2}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            rows={2}
            className="w-full text-sm rounded-md px-2 py-1 border border-gray-300 bg-white resize-none"
          />
          {err && (
            <p className="mt-1 text-xs text-rose-600">⚠️ {err}</p>
          )}
        </td>
        <td className="px-3 py-2 align-top text-right">
          <div className="flex justify-end gap-1">
            <button
              onClick={onCancelEdit}
              disabled={saving}
              className="text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={
                saving ||
                !nickname.trim() ||
                !studentClass.trim() ||
                !content.trim()
              }
              className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-3 py-2 align-top">
        <input type="checkbox" checked={selected} onChange={onToggle} />
      </td>
      <td className="px-3 py-2 text-gray-600 align-top">{cityName}</td>
      <td className="px-3 py-2 font-medium text-gray-800 align-top">
        {post.nickname}
      </td>
      <td className="px-3 py-2 text-gray-600 align-top">{post.studentClass}</td>
      <td className="px-3 py-2 text-gray-700 align-top max-w-md">
        <span className="whitespace-pre-wrap line-clamp-3">{post.content}</span>
      </td>
      <td className="px-3 py-2 text-gray-500 align-top whitespace-nowrap">
        {formatTime(post.time)}
      </td>
      <td className="px-3 py-2 align-top text-right">
        <div className="flex justify-end gap-1">
          <button
            onClick={onEdit}
            aria-label="Edit"
            className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete"
            className="p-1.5 rounded hover:bg-rose-100 text-gray-500 hover:text-rose-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function SettingsDialog({
  creds,
  onClose,
  onSaved,
}: {
  creds: Credentials;
  onClose: () => void;
  onSaved: (c: Credentials) => void;
}) {
  const [newUsername, setNewUsername] = useState(creds.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) {
      setErr('Username and new password are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErr('New password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader(creds),
        },
        body: JSON.stringify({
          currentUsername: creds.username,
          currentPassword: creds.password,
          newUsername: newUsername.trim(),
          newPassword,
        }),
      });
      if (!res.ok) throw new Error(await readError(res));
      onSaved({ username: newUsername.trim(), password: newPassword });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
      >
        <h4 className="text-base font-semibold text-gray-900 mb-1">
          Change credentials
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          New credentials replace the defaults stored in KV. They take effect
          immediately.
        </p>
        <label className="block text-xs text-gray-500 mb-1">New username</label>
        <input
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="w-full text-sm rounded-lg px-3 py-2 mb-3 border border-gray-200 focus:outline-none focus:border-blue-400"
        />
        <label className="block text-xs text-gray-500 mb-1">
          New password (min 6 chars)
        </label>
        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          className="w-full text-sm rounded-lg px-3 py-2 mb-3 border border-gray-200 focus:outline-none focus:border-blue-400"
        />
        <label className="block text-xs text-gray-500 mb-1">
          Confirm new password
        </label>
        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          className="w-full text-sm rounded-lg px-3 py-2 mb-4 border border-gray-200 focus:outline-none focus:border-blue-400"
        />
        {err && (
          <p className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-2 py-1">
            ⚠️ {err}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm px-4 py-1.5 rounded-lg"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
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
      className="fixed inset-0 z-[55] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white text-sm px-4 py-1.5 rounded-lg transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
