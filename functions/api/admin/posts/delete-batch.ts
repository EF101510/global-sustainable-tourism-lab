import { adminDeletePosts } from '../../../../src/server/board-handler';
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

interface BatchBody {
  targets?: Array<{ cityId?: string; postId?: string }>;
}

/**
 * POST /api/admin/posts/delete-batch
 * Auth: Basic
 * Body: { targets: [{ cityId, postId }, ...] }
 * Response: { ok: true, removed: number }
 *
 * Single endpoint (vs N parallel DELETEs) because each affected city
 * needs only one KV read+write — that keeps us under the 1k writes/day
 * free-tier budget when the teacher wipes a class's posts.
 */
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
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

  let body: BatchBody;
  try {
    body = (await request.json()) as BatchBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const targets = (body.targets ?? [])
    .filter(
      (t): t is { cityId: string; postId: string } =>
        typeof t.cityId === 'string' && typeof t.postId === 'string'
    )
    .map((t) => ({ cityId: t.cityId, postId: t.postId }));

  if (targets.length === 0) {
    return json({ error: 'No targets provided.' }, 400);
  }

  try {
    const removed = await adminDeletePosts(env.BOARD, targets);
    return json({ ok: true, removed });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
};
