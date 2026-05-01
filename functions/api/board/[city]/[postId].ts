import {
  BoardForbiddenError,
  BoardNotFoundError,
  BoardValidationError,
  deletePost,
  isValidCityId,
  updatePost,
  type UpdatePostInput,
} from '../../../../src/server/board-handler';

/**
 * PATCH /api/board/:city/:postId
 *
 * Body: { editToken, nickname?, studentClass?, content? }
 * The server only allows the edit when the supplied editToken matches
 * the one stored at create time. The token is returned exactly once
 * from the POST response and cached client-side in localStorage.
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

export const onRequestPatch: PagesFunction<Env, 'city' | 'postId'> = async ({
  params,
  env,
  request,
}) => {
  const cityId = String(params.city);
  const postId = String(params.postId);

  if (!isValidCityId(cityId)) {
    return json({ error: 'Unknown city' }, 404);
  }
  if (!env.BOARD) {
    return json(
      { error: 'BOARD KV namespace is not bound. See wrangler.toml.' },
      500
    );
  }

  let body: UpdatePostInput;
  try {
    body = (await request.json()) as UpdatePostInput;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  try {
    const post = await updatePost(env.BOARD, cityId, postId, body);
    return json({ post });
  } catch (e) {
    if (e instanceof BoardValidationError) return json({ error: e.message }, 400);
    if (e instanceof BoardForbiddenError) return json({ error: e.message }, 403);
    if (e instanceof BoardNotFoundError) return json({ error: e.message }, 404);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env, 'city' | 'postId'> = async ({
  params,
  env,
  request,
}) => {
  const cityId = String(params.city);
  const postId = String(params.postId);
  if (!isValidCityId(cityId)) return json({ error: 'Unknown city' }, 404);
  if (!env.BOARD) {
    return json(
      { error: 'BOARD KV namespace is not bound. See wrangler.toml.' },
      500
    );
  }
  let body: { editToken?: string };
  try {
    body = (await request.json()) as { editToken?: string };
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  try {
    await deletePost(env.BOARD, cityId, postId, body.editToken ?? '');
    return json({ ok: true });
  } catch (e) {
    if (e instanceof BoardForbiddenError) return json({ error: e.message }, 403);
    if (e instanceof BoardNotFoundError) return json({ error: e.message }, 404);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
};
