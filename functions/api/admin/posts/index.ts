import { listAllPosts } from '../../../../src/server/board-handler';
import {
  AdminAuthError,
  requireAdmin,
} from '../../../../src/server/admin-handler';

interface Env {
  BOARD: KVNamespace;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/admin/posts
 * Auth: Basic
 * Response: { posts: AdminPost[] }  — every post across every city,
 *           sorted newest-first, each tagged with cityId.
 */
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.BOARD) {
    return json(
      { error: 'BOARD KV namespace is not bound. See wrangler.toml.' },
      500
    );
  }
  try {
    await requireAdmin(env.BOARD, request.headers.get('Authorization'));
  } catch (e) {
    if (e instanceof AdminAuthError) return json({ error: e.message }, 401);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
  try {
    const posts = await listAllPosts(env.BOARD);
    return json({ posts });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
};
