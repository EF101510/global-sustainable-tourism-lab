import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

// Inlined locally to avoid cross-tsconfig type imports. Kept in sync with
// the source-of-truth definition in `src/server/chat-handler.ts`.
type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

interface DevMiddlewareConfig {
  apiKey: string | undefined;
  model: string | undefined;
  effort: EffortLevel | undefined;
}

/**
 * Dev-only middleware that handles `POST /api/chat` by calling the same
 * shared handler that the production Vercel function uses. Loads the API
 * key + model + effort from `.env` / `.env.local` via Vite's `loadEnv`.
 * In production the `api/chat.ts` serverless function takes over instead.
 */
function apiChatDevMiddleware(config: DevMiddlewareConfig): Plugin {
  return {
    name: 'api-chat-dev',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          send(res, 405, { error: 'Method Not Allowed' });
          return;
        }
        if (!config.apiKey) {
          send(res, 500, {
            error:
              'ANTHROPIC_API_KEY is not set. Add it to .env.local in the project root.',
          });
          return;
        }

        let body: { system: string; messages: unknown[] };
        try {
          body = JSON.parse(await readBody(req));
        } catch {
          send(res, 400, { error: 'Invalid JSON body' });
          return;
        }

        try {
          // Lazy import so the SDK isn't loaded for non-/api/chat requests.
          const { handleChat } = await import('./src/server/chat-handler');
          const result = await handleChat(
            body as Parameters<typeof handleChat>[0],
            { apiKey: config.apiKey, model: config.model, effort: config.effort }
          );
          send(res, 200, result);
        } catch (e) {
          const { statusFromError } = await import('./src/server/chat-handler');
          send(res, statusFromError(e), {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      });
    },
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default defineConfig(async ({ mode }) => {
  // Pass `''` as prefix to load every variable, not just `VITE_*` — we need
  // the server-only `ANTHROPIC_*` keys. They're never inlined into the
  // client bundle because we don't reference `import.meta.env.*` for them.
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  const { readChatConfig } = await import('./src/server/chat-handler');
  const { model, effort } = readChatConfig({
    ANTHROPIC_MODEL: env.ANTHROPIC_MODEL,
    ANTHROPIC_EFFORT: env.ANTHROPIC_EFFORT,
  });

  return {
    plugins: [react(), apiChatDevMiddleware({ apiKey, model, effort })],
    server: {
      port: 5173,
      open: true,
    },
  };
});
