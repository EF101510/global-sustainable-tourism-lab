import {
  handleChat,
  readChatConfig,
  statusFromError,
  type ChatRequestBody,
} from '../../src/server/chat-handler';

/**
 * Cloudflare Pages Function for `POST /api/chat`.
 *
 * The shared `handleChat` logic lives in `src/server/chat-handler.ts` so
 * both the Vite dev middleware (in `vite.config.ts`) and this production
 * Pages Function call the same code path.
 *
 * Env binding (set in Cloudflare Pages dashboard → Settings → Environment
 * variables, or via `wrangler pages secret put` for sensitive values):
 *   - `ANTHROPIC_API_KEY` (encrypted secret)
 *   - `ANTHROPIC_MODEL` (plain text, optional — see .env.example)
 *   - `ANTHROPIC_EFFORT` (plain text, optional — see .env.example)
 *
 * KV binding for the future shared Student Board (declared in
 * `wrangler.toml`, currently commented out — un-comment when wiring up):
 *   - `BOARD: KVNamespace`
 */
interface Env {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  ANTHROPIC_EFFORT?: string;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'ANTHROPIC_API_KEY is not configured.' }, 500);
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  let model: string | undefined;
  let effort: ReturnType<typeof readChatConfig>['effort'];
  try {
    ({ model, effort } = readChatConfig({
      ANTHROPIC_MODEL: env.ANTHROPIC_MODEL,
      ANTHROPIC_EFFORT: env.ANTHROPIC_EFFORT,
    }));
  } catch (e) {
    // Misconfigured ANTHROPIC_EFFORT — surface the validation error.
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }

  try {
    const result = await handleChat(body, {
      apiKey: env.ANTHROPIC_API_KEY,
      model,
      effort,
    });
    return json(result, 200);
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : String(e) },
      statusFromError(e)
    );
  }
};
