import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Dev-only middleware that handles `POST /api/chat` by calling the same
 * shared handler that the production Vercel function uses. Loads the API
 * key from `.env` / `.env.local` via Vite's `loadEnv`. In production the
 * `api/chat.ts` serverless function takes over instead.
 */
function apiChatDevMiddleware(apiKey: string | undefined): Plugin {
  return {
    name: 'api-chat-dev',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          send(res, 405, { error: 'Method Not Allowed' });
          return;
        }
        if (!apiKey) {
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
          const { handleChat, statusFromError } = await import(
            './src/server/chat-handler'
          );
          const result = await handleChat(
            body as Parameters<typeof handleChat>[0],
            { apiKey }
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

export default defineConfig(({ mode }) => {
  // Pass `''` as prefix to load every variable, not just `VITE_*` — we need
  // the server-only `ANTHROPIC_API_KEY`. It's never inlined into the client
  // bundle because we don't reference `import.meta.env.ANTHROPIC_API_KEY`.
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

  return {
    plugins: [react(), apiChatDevMiddleware(apiKey)],
    server: {
      port: 5173,
      open: true,
    },
  };
});
