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
 * Dev-only middleware that handles `POST /api/chat` and the
 * `/api/board/:city` board endpoints by calling the same shared handlers
 * that the production Cloudflare Pages Functions use. Loads the
 * Anthropic API key / model / effort from `.env` / `.env.local` via
 * Vite's `loadEnv`. The board uses a per-process in-memory Map (resets
 * on dev-server restart) — production wires `env.BOARD` to a real
 * Workers KV namespace.
 */
function apiDevMiddleware(config: DevMiddlewareConfig): Plugin {
  // Shared in-memory KV substitute for the dev /api/board endpoints.
  const memory = new Map<string, string>();
  const boardStore = {
    async get(key: string): Promise<string | null> {
      return memory.get(key) ?? null;
    },
    async put(key: string, value: string): Promise<void> {
      memory.set(key, value);
    },
  };

  return {
    name: 'api-dev',
    configureServer(server) {
      // /api/board/:city — custom matcher (the prefix form
      // `server.middlewares.use('/api/board', ...)` has been flaky for
      // us under Vite 5's HTML-first middleware order).
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        const match = path.match(/^\/api\/board\/([^/]+)\/?$/);
        if (!match) return next();
        const cityId = match[1];

        const { isValidCityId, listPosts, createPost, BoardValidationError } =
          await import('./src/server/board-handler');

        if (!isValidCityId(cityId)) {
          send(res, 404, { error: 'Unknown city' });
          return;
        }

        if (req.method === 'GET') {
          try {
            const posts = await listPosts(boardStore, cityId);
            send(res, 200, { posts });
          } catch (e) {
            send(res, 500, {
              error: e instanceof Error ? e.message : String(e),
            });
          }
          return;
        }

        if (req.method === 'POST') {
          let body: { nickname: string; content: string };
          try {
            body = JSON.parse(await readBody(req));
          } catch {
            send(res, 400, { error: 'Invalid JSON body' });
            return;
          }
          try {
            const post = await createPost(boardStore, cityId, body);
            send(res, 201, { post });
          } catch (e) {
            const status = e instanceof BoardValidationError ? 400 : 500;
            send(res, status, {
              error: e instanceof Error ? e.message : String(e),
            });
          }
          return;
        }

        send(res, 405, { error: 'Method Not Allowed' });
      });

      // /api/chat
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
    plugins: [react(), apiDevMiddleware({ apiKey, model, effort })],
    server: {
      port: 5173,
      open: true,
    },
  };
});
