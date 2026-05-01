import {
  BoardValidationError,
  createPost,
  isValidCityId,
  listPosts,
  type CreatePostInput,
} from '../../../src/server/board-handler';

/**
 * Cloudflare Pages Function for the shared Student Board.
 *
 * Routes:
 *   GET  /api/board/:city  → { posts: BoardPost[] }
 *   POST /api/board/:city  → body { nickname, content } → { post: BoardPost }
 *
 * Storage: Workers KV under key `board:${cityId}`. Free tier (100 K
 * reads/day, 1 K writes/day) easily covers a class. Eventual
 * consistency ~1 minute globally — acceptable for a low-traffic
 * comment board.
 *
 * Bind the namespace via `wrangler.toml`:
 *   [[kv_namespaces]]
 *   binding = "BOARD"
 *   id = "<id from `wrangler kv namespace create BOARD`>"
 */
interface Env {
  BOARD: KVNamespace;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestGet: PagesFunction<Env, 'city'> = async ({
  params,
  env,
}) => {
  const cityId = String(params.city);
  if (!isValidCityId(cityId)) {
    return json({ error: 'Unknown city' }, 404);
  }
  if (!env.BOARD) {
    return json(
      { error: 'BOARD KV namespace is not bound. See wrangler.toml.' },
      500
    );
  }
  try {
    const posts = await listPosts(env.BOARD, cityId);
    return json({ posts });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
};

export const onRequestPost: PagesFunction<Env, 'city'> = async ({
  params,
  env,
  request,
}) => {
  const cityId = String(params.city);
  if (!isValidCityId(cityId)) {
    return json({ error: 'Unknown city' }, 404);
  }
  if (!env.BOARD) {
    return json(
      { error: 'BOARD KV namespace is not bound. See wrangler.toml.' },
      500
    );
  }

  let body: CreatePostInput;
  try {
    body = (await request.json()) as CreatePostInput;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  try {
    const post = await createPost(env.BOARD, cityId, body);
    return json({ post }, 201);
  } catch (e) {
    if (e instanceof BoardValidationError) {
      return json({ error: e.message }, 400);
    }
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
};
