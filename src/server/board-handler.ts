import type { BoardPost } from '../types';
import { CITIES } from '../data/cities';

/**
 * Minimal KV interface that both Cloudflare's `KVNamespace` and the
 * in-memory dev map satisfy. Keeps the logic platform-agnostic so
 * `vite.config.ts` (Node) and `functions/api/board/[city]*` (Workers
 * runtime) share the same code path.
 */
export interface BoardStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

/** Cap per-city post count so a single hot city can't bloat KV writes
 *  beyond the free-tier daily quota. Oldest posts are dropped. */
const MAX_POSTS_PER_CITY = 200;
const MAX_NICKNAME_CHARS = 20;
const MAX_CLASS_CHARS = 30;
const MAX_CONTENT_CHARS = 500;

const VALID_CITY_IDS: ReadonlySet<string> = new Set(CITIES.map((c) => c.id));

/**
 * What we actually persist in KV — `BoardPost` plus an `editToken` the
 * server hands back to the client once on create. The client stores
 * that token in localStorage and sends it with PATCH requests; the
 * server only allows the edit when the tokens match. This is "trust
 * the original poster, not arbitrary clients" — it doesn't prevent
 * someone with shell access to KV from editing, but it does stop
 * casual tampering between students.
 */
interface StoredBoardPost extends BoardPost {
  editToken: string;
}

export function isValidCityId(id: string): boolean {
  return VALID_CITY_IDS.has(id);
}

function storageKey(cityId: string): string {
  return `board:${cityId}`;
}

/** Strip the editToken before returning posts to public consumers. */
function publicPost(p: StoredBoardPost): BoardPost {
  // Destructure to drop editToken; ESLint will whine about unused but
  // keeping it explicit makes the intent obvious.
  const { editToken: _editToken, ...rest } = p;
  void _editToken;
  return rest;
}

async function readAll(
  store: BoardStore,
  cityId: string
): Promise<StoredBoardPost[]> {
  const raw = await store.get(storageKey(cityId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Tolerate older shapes missing studentClass / editToken — fill in
    // sane defaults so legacy records still render.
    return parsed.map(
      (p: Partial<StoredBoardPost>): StoredBoardPost => ({
        id: String(p.id ?? ''),
        nickname: String(p.nickname ?? ''),
        studentClass: String(p.studentClass ?? ''),
        content: String(p.content ?? ''),
        time: Number(p.time ?? 0),
        editToken: String(p.editToken ?? ''),
      })
    );
  } catch {
    return [];
  }
}

async function writeAll(
  store: BoardStore,
  cityId: string,
  posts: StoredBoardPost[]
): Promise<void> {
  await store.put(storageKey(cityId), JSON.stringify(posts));
}

export async function listPosts(
  store: BoardStore,
  cityId: string
): Promise<BoardPost[]> {
  const all = await readAll(store, cityId);
  return all
    .map(publicPost)
    .sort((a, b) => b.time - a.time);
}

export interface CreatePostInput {
  nickname: string;
  studentClass: string;
  content: string;
}

export interface CreatePostResult {
  post: BoardPost;
  /** Returned ONCE on create — client must save this to be able to
   *  edit the post later. Server never returns it again. */
  editToken: string;
}

export class BoardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardValidationError';
  }
}

export class BoardForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardForbiddenError';
  }
}

export class BoardNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardNotFoundError';
  }
}

function validateText(
  field: string,
  value: string | undefined,
  max: number
): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    throw new BoardValidationError(`${field} is required.`);
  }
  if (trimmed.length > max) {
    throw new BoardValidationError(
      `${field} must be ${max} characters or fewer.`
    );
  }
  return trimmed;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateEditToken(): string {
  // Workers + modern Node both expose crypto.randomUUID(); fall back
  // for the rare case we run somewhere that doesn't.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export async function createPost(
  store: BoardStore,
  cityId: string,
  input: CreatePostInput
): Promise<CreatePostResult> {
  const nickname = validateText('Nickname', input.nickname, MAX_NICKNAME_CHARS);
  const studentClass = validateText(
    'Class',
    input.studentClass,
    MAX_CLASS_CHARS
  );
  const content = validateText('Content', input.content, MAX_CONTENT_CHARS);

  const existing = await readAll(store, cityId);
  const stored: StoredBoardPost = {
    id: generateId(),
    nickname,
    studentClass,
    content,
    time: Date.now(),
    editToken: generateEditToken(),
  };
  const updated = [stored, ...existing].slice(0, MAX_POSTS_PER_CITY);
  await writeAll(store, cityId, updated);
  return { post: publicPost(stored), editToken: stored.editToken };
}

export interface UpdatePostInput {
  /** Required — the token the server returned when this post was
   *  created. Without a matching token the edit is rejected as 403. */
  editToken: string;
  nickname?: string;
  studentClass?: string;
  content?: string;
}

export async function updatePost(
  store: BoardStore,
  cityId: string,
  postId: string,
  input: UpdatePostInput
): Promise<BoardPost> {
  if (!input.editToken) {
    throw new BoardForbiddenError('editToken is required.');
  }
  const all = await readAll(store, cityId);
  const idx = all.findIndex((p) => p.id === postId);
  if (idx < 0) {
    throw new BoardNotFoundError('Post not found.');
  }
  const current = all[idx];
  if (current.editToken !== input.editToken) {
    throw new BoardForbiddenError(
      'editToken does not match — only the original poster can edit.'
    );
  }

  const next: StoredBoardPost = { ...current };
  if (input.nickname !== undefined) {
    next.nickname = validateText('Nickname', input.nickname, MAX_NICKNAME_CHARS);
  }
  if (input.studentClass !== undefined) {
    next.studentClass = validateText('Class', input.studentClass, MAX_CLASS_CHARS);
  }
  if (input.content !== undefined) {
    next.content = validateText('Content', input.content, MAX_CONTENT_CHARS);
  }

  all[idx] = next;
  await writeAll(store, cityId, all);
  return publicPost(next);
}

export async function deletePost(
  store: BoardStore,
  cityId: string,
  postId: string,
  editToken: string
): Promise<void> {
  if (!editToken) {
    throw new BoardForbiddenError('editToken is required.');
  }
  const all = await readAll(store, cityId);
  const idx = all.findIndex((p) => p.id === postId);
  if (idx < 0) throw new BoardNotFoundError('Post not found.');
  if (all[idx].editToken !== editToken) {
    throw new BoardForbiddenError(
      'editToken does not match — only the original poster can delete.'
    );
  }
  all.splice(idx, 1);
  await writeAll(store, cityId, all);
}

/* -------------------------------------------------------------------------- */
/* Admin operations — skip editToken checks. Auth is done by the caller       */
/* (see src/server/admin-handler.ts). These do NOT validate the actor.        */
/* -------------------------------------------------------------------------- */

export interface AdminPost extends BoardPost {
  cityId: string;
}

/**
 * List every post across every known city, tagged with its cityId.
 * Used by the admin dashboard. Cost: 25 KV reads (one per city) — well
 * within the free-tier budget for a tool a teacher uses occasionally.
 */
export async function listAllPosts(store: BoardStore): Promise<AdminPost[]> {
  const out: AdminPost[] = [];
  for (const cityId of VALID_CITY_IDS) {
    const posts = await readAll(store, cityId);
    for (const p of posts) {
      const { editToken: _t, ...rest } = p;
      void _t;
      out.push({ ...rest, cityId });
    }
  }
  return out.sort((a, b) => b.time - a.time);
}

export interface AdminUpdateInput {
  nickname?: string;
  studentClass?: string;
  content?: string;
}

export async function adminUpdatePost(
  store: BoardStore,
  cityId: string,
  postId: string,
  input: AdminUpdateInput
): Promise<BoardPost> {
  const all = await readAll(store, cityId);
  const idx = all.findIndex((p) => p.id === postId);
  if (idx < 0) throw new BoardNotFoundError('Post not found.');
  const next: StoredBoardPost = { ...all[idx] };
  if (input.nickname !== undefined) {
    next.nickname = validateText('Nickname', input.nickname, MAX_NICKNAME_CHARS);
  }
  if (input.studentClass !== undefined) {
    next.studentClass = validateText('Class', input.studentClass, MAX_CLASS_CHARS);
  }
  if (input.content !== undefined) {
    next.content = validateText('Content', input.content, MAX_CONTENT_CHARS);
  }
  all[idx] = next;
  await writeAll(store, cityId, all);
  return publicPost(next);
}

export async function adminDeletePost(
  store: BoardStore,
  cityId: string,
  postId: string
): Promise<void> {
  const all = await readAll(store, cityId);
  const filtered = all.filter((p) => p.id !== postId);
  if (filtered.length === all.length) {
    throw new BoardNotFoundError('Post not found.');
  }
  await writeAll(store, cityId, filtered);
}

/**
 * Bulk delete. Groups targets by cityId so each city's KV value is
 * read+written exactly once even if many posts in that city are
 * deleted. Returns the number of posts actually removed.
 */
export async function adminDeletePosts(
  store: BoardStore,
  targets: ReadonlyArray<{ cityId: string; postId: string }>
): Promise<number> {
  const byCity = new Map<string, Set<string>>();
  for (const { cityId, postId } of targets) {
    if (!isValidCityId(cityId)) continue;
    let set = byCity.get(cityId);
    if (!set) {
      set = new Set();
      byCity.set(cityId, set);
    }
    set.add(postId);
  }

  let removed = 0;
  for (const [cityId, ids] of byCity) {
    const all = await readAll(store, cityId);
    const filtered = all.filter((p) => !ids.has(p.id));
    removed += all.length - filtered.length;
    if (filtered.length !== all.length) {
      await writeAll(store, cityId, filtered);
    }
  }
  return removed;
}
