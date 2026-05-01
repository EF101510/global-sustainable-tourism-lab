import {
  adminDeletePost,
  adminUpdatePost,
  BoardNotFoundError,
  BoardValidationError,
  isValidCityId,
  type AdminUpdateInput,
} from '../../../../../src/server/board-handler';
import {
  AdminAuthError,
  requireAdmin,
} from '../../../../../src/server/admin-handler';

interface Env {
  BOARD: KVNamespace;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function authed<T>(
  env: Env,
  request: Request,
  fn: () => Promise<Response>
): Promise<Response> {
  void undefined as T; // keep generic for symmetry
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
  return fn();
}

/**
 * PATCH /api/admin/posts/:city/:postId
 * DELETE /api/admin/posts/:city/:postId
 * Auth: Basic
 *
 * Both bypass the editToken check — admin authority overrides the
 * "only the original poster can edit" rule.
 */

export const onRequestPatch: PagesFunction<Env, 'city' | 'postId'> = async ({
  env,
  request,
  params,
}) =>
  authed(env, request, async () => {
    const cityId = String(params.city);
    const postId = String(params.postId);
    if (!isValidCityId(cityId)) return json({ error: 'Unknown city' }, 404);

    let body: AdminUpdateInput;
    try {
      body = (await request.json()) as AdminUpdateInput;
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    try {
      const post = await adminUpdatePost(env.BOARD, cityId, postId, body);
      return json({ post });
    } catch (e) {
      if (e instanceof BoardValidationError) return json({ error: e.message }, 400);
      if (e instanceof BoardNotFoundError) return json({ error: e.message }, 404);
      return json({ error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });

export const onRequestDelete: PagesFunction<Env, 'city' | 'postId'> = async ({
  env,
  request,
  params,
}) =>
  authed(env, request, async () => {
    const cityId = String(params.city);
    const postId = String(params.postId);
    if (!isValidCityId(cityId)) return json({ error: 'Unknown city' }, 404);
    try {
      await adminDeletePost(env.BOARD, cityId, postId);
      return json({ ok: true });
    } catch (e) {
      if (e instanceof BoardNotFoundError) return json({ error: e.message }, 404);
      return json({ error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });
