import {
  AdminAuthError,
  AdminValidationError,
  requireAdmin,
  updateCredentials,
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
 * POST /api/admin/credentials
 * Auth: Basic <base64(currentUser:currentPassword)>
 * Body: { currentUsername, currentPassword, newUsername, newPassword }
 *
 * Writes/replaces `admin:credentials` in KV. After this call the
 * defaults stop working.
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

  let body: {
    currentUsername?: string;
    currentPassword?: string;
    newUsername?: string;
    newPassword?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  try {
    const result = await updateCredentials(env.BOARD, {
      currentUsername: body.currentUsername ?? '',
      currentPassword: body.currentPassword ?? '',
      newUsername: body.newUsername ?? '',
      newPassword: body.newPassword ?? '',
    });
    return json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof AdminAuthError) return json({ error: e.message }, 401);
    if (e instanceof AdminValidationError) return json({ error: e.message }, 400);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
};
