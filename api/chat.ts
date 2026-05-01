import {
  handleChat,
  readChatConfig,
  statusFromError,
  type ChatRequestBody,
} from '../src/server/chat-handler';

/**
 * Production proxy for `POST /api/chat`. Deployed as a serverless function
 * (Vercel auto-detects files in `api/`; Netlify uses an analogous folder
 * with the same default export shape). The dev environment uses the Vite
 * middleware in `vite.config.ts` instead — both call the same handler.
 *
 * Reads `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, and `ANTHROPIC_EFFORT`
 * from the platform's environment variables. See `.env.example` for
 * available values.
 *
 * Types are kept loose (`req: { method?, body }` and a Vercel-style `res`
 * with `status().json()`) so the file works on Vercel's Node runtime
 * without pulling in `@vercel/node` as a dependency. If you migrate to
 * another platform, swap the signature to whatever it expects and call
 * `handleChat` the same way.
 */
interface ProxyRequest {
  method?: string;
  body: ChatRequestBody;
}
interface ProxyResponse {
  status(code: number): ProxyResponse;
  json(body: unknown): ProxyResponse | void;
}

export default async function handler(
  req: ProxyRequest,
  res: ProxyResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured.' });
    return;
  }

  let model: string | undefined;
  let effort: ReturnType<typeof readChatConfig>['effort'];
  try {
    ({ model, effort } = readChatConfig(process.env));
  } catch (e) {
    // Misconfigured ANTHROPIC_EFFORT — surface the validation error.
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    return;
  }

  try {
    const result = await handleChat(req.body, { apiKey, model, effort });
    res.status(200).json(result);
  } catch (e) {
    res.status(statusFromError(e)).json({
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
