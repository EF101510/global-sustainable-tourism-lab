import {
  isUsingDefaults,
  verifyCredentials,
} from '../../../src/server/admin-handler';

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
 * POST /api/admin/login
 * Body: { username, password }
 * Response: { ok: true, usingDefaults: boolean } | { error }
 *
 * No session token is issued — the client keeps the credentials in
 * sessionStorage and sends them as Basic auth on every subsequent
 * admin request. `usingDefaults` lets the UI nag the teacher to
 * change them on first login.
 */
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.BOARD) {
    return json(
      { error: 'BOARD KV namespace is not bound. See wrangler.toml.' },
      500
    );
  }
  let body: { username?: string; password?: string };
  try {
    body = (await request.json()) as { username?: string; password?: string };
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const ok = await verifyCredentials(
    env.BOARD,
    body.username ?? '',
    body.password ?? ''
  );
  if (!ok) return json({ error: 'Invalid username or password.' }, 401);
  const usingDefaults = await isUsingDefaults(env.BOARD);
  return json({ ok: true, usingDefaults });
};
