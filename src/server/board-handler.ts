import type { BoardPost } from '../types';
import { CITIES } from '../data/cities';

/**
 * Minimal KV interface that both Cloudflare's `KVNamespace` and the
 * in-memory dev map satisfy. Keeps the logic platform-agnostic so
 * `vite.config.ts` (Node) and `functions/api/board/[city].ts`
 * (Workers runtime) share the same code path.
 */
export interface BoardStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

/** Cap per-city post count so a single hot city can't bloat KV writes
 *  beyond the free-tier daily quota. Oldest posts are dropped. */
const MAX_POSTS_PER_CITY = 200;
const MAX_NICKNAME_CHARS = 20;
const MAX_CONTENT_CHARS = 500;

const VALID_CITY_IDS: ReadonlySet<string> = new Set(CITIES.map((c) => c.id));

export function isValidCityId(id: string): boolean {
  return VALID_CITY_IDS.has(id);
}

function storageKey(cityId: string): string {
  return `board:${cityId}`;
}

export async function listPosts(
  store: BoardStore,
  cityId: string
): Promise<BoardPost[]> {
  const raw = await store.get(storageKey(cityId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as BoardPost[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.time - a.time);
  } catch {
    // Corrupted entry — treat as empty so a single bad write doesn't
    // permanently break a city's board. Next successful POST overwrites.
    return [];
  }
}

export interface CreatePostInput {
  nickname: string;
  content: string;
}

export class BoardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardValidationError';
  }
}

export async function createPost(
  store: BoardStore,
  cityId: string,
  input: CreatePostInput
): Promise<BoardPost> {
  const nickname = (input.nickname ?? '').trim();
  const content = (input.content ?? '').trim();

  if (!nickname) {
    throw new BoardValidationError('Nickname is required.');
  }
  if (nickname.length > MAX_NICKNAME_CHARS) {
    throw new BoardValidationError(
      `Nickname must be ${MAX_NICKNAME_CHARS} characters or fewer.`
    );
  }
  if (!content) {
    throw new BoardValidationError('Content is required.');
  }
  if (content.length > MAX_CONTENT_CHARS) {
    throw new BoardValidationError(
      `Content must be ${MAX_CONTENT_CHARS} characters or fewer.`
    );
  }

  const existing = await listPosts(store, cityId);
  const post: BoardPost = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nickname,
    content,
    time: Date.now(),
  };
  const updated = [post, ...existing].slice(0, MAX_POSTS_PER_CITY);
  await store.put(storageKey(cityId), JSON.stringify(updated));
  return post;
}
