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
      // /api/admin/* — handled before /api/board so the prefix doesn't
      // get caught by the board matcher.
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        if (!path.startsWith('/api/admin/')) return next();

        const {
          AdminAuthError,
          AdminValidationError,
          requireAdmin,
          updateCredentials,
          verifyCredentials,
          isUsingDefaults,
        } = await import('./src/server/admin-handler');
        const {
          adminDeletePost,
          adminDeletePosts,
          adminUpdatePost,
          BoardNotFoundError,
          BoardValidationError,
          isValidCityId,
          listAllPosts,
        } = await import('./src/server/board-handler');

        const authHeader =
          (req.headers['authorization'] as string | undefined) ?? null;

        const guard = async (): Promise<true | { status: number; error: string }> => {
          try {
            await requireAdmin(boardStore, authHeader);
            return true;
          } catch (e) {
            if (e instanceof AdminAuthError)
              return { status: 401, error: e.message };
            return {
              status: 500,
              error: e instanceof Error ? e.message : String(e),
            };
          }
        };

        // POST /api/admin/login
        if (path === '/api/admin/login') {
          if (req.method !== 'POST') {
            send(res, 405, { error: 'Method Not Allowed' });
            return;
          }
          let body: { username?: string; password?: string };
          try {
            body = JSON.parse(await readBody(req));
          } catch {
            send(res, 400, { error: 'Invalid JSON body' });
            return;
          }
          const ok = await verifyCredentials(
            boardStore,
            body.username ?? '',
            body.password ?? ''
          );
          if (!ok) {
            send(res, 401, { error: 'Invalid username or password.' });
            return;
          }
          send(res, 200, {
            ok: true,
            usingDefaults: await isUsingDefaults(boardStore),
          });
          return;
        }

        // POST /api/admin/credentials
        if (path === '/api/admin/credentials') {
          if (req.method !== 'POST') {
            send(res, 405, { error: 'Method Not Allowed' });
            return;
          }
          const g = await guard();
          if (g !== true) {
            send(res, g.status, { error: g.error });
            return;
          }
          let body: {
            currentUsername?: string;
            currentPassword?: string;
            newUsername?: string;
            newPassword?: string;
          };
          try {
            body = JSON.parse(await readBody(req));
          } catch {
            send(res, 400, { error: 'Invalid JSON body' });
            return;
          }
          try {
            const result = await updateCredentials(boardStore, {
              currentUsername: body.currentUsername ?? '',
              currentPassword: body.currentPassword ?? '',
              newUsername: body.newUsername ?? '',
              newPassword: body.newPassword ?? '',
            });
            send(res, 200, { ok: true, ...result });
          } catch (e) {
            if (e instanceof AdminAuthError) {
              send(res, 401, { error: e.message });
            } else if (e instanceof AdminValidationError) {
              send(res, 400, { error: e.message });
            } else {
              send(res, 500, {
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }
          return;
        }

        // GET /api/admin/posts
        if (path === '/api/admin/posts') {
          if (req.method !== 'GET') {
            send(res, 405, { error: 'Method Not Allowed' });
            return;
          }
          const g = await guard();
          if (g !== true) {
            send(res, g.status, { error: g.error });
            return;
          }
          try {
            const posts = await listAllPosts(boardStore);
            send(res, 200, { posts });
          } catch (e) {
            send(res, 500, {
              error: e instanceof Error ? e.message : String(e),
            });
          }
          return;
        }

        // POST /api/admin/posts/delete-batch
        if (path === '/api/admin/posts/delete-batch') {
          if (req.method !== 'POST') {
            send(res, 405, { error: 'Method Not Allowed' });
            return;
          }
          const g = await guard();
          if (g !== true) {
            send(res, g.status, { error: g.error });
            return;
          }
          let body: { targets?: Array<{ cityId?: string; postId?: string }> };
          try {
            body = JSON.parse(await readBody(req));
          } catch {
            send(res, 400, { error: 'Invalid JSON body' });
            return;
          }
          const targets = (body.targets ?? [])
            .filter(
              (t): t is { cityId: string; postId: string } =>
                typeof t.cityId === 'string' && typeof t.postId === 'string'
            )
            .map((t) => ({ cityId: t.cityId, postId: t.postId }));
          if (targets.length === 0) {
            send(res, 400, { error: 'No targets provided.' });
            return;
          }
          try {
            const removed = await adminDeletePosts(boardStore, targets);
            send(res, 200, { ok: true, removed });
          } catch (e) {
            send(res, 500, {
              error: e instanceof Error ? e.message : String(e),
            });
          }
          return;
        }

        // /api/admin/posts/:city/:postId  (PATCH | DELETE)
        const itemMatch = path.match(
          /^\/api\/admin\/posts\/([^/]+)\/([^/]+)\/?$/
        );
        if (itemMatch) {
          const g = await guard();
          if (g !== true) {
            send(res, g.status, { error: g.error });
            return;
          }
          const cityId = itemMatch[1];
          const postId = itemMatch[2];
          if (!isValidCityId(cityId)) {
            send(res, 404, { error: 'Unknown city' });
            return;
          }
          if (req.method === 'PATCH') {
            let body: {
              nickname?: string;
              studentClass?: string;
              content?: string;
            };
            try {
              body = JSON.parse(await readBody(req));
            } catch {
              send(res, 400, { error: 'Invalid JSON body' });
              return;
            }
            try {
              const post = await adminUpdatePost(
                boardStore,
                cityId,
                postId,
                body
              );
              send(res, 200, { post });
            } catch (e) {
              if (e instanceof BoardValidationError)
                send(res, 400, { error: e.message });
              else if (e instanceof BoardNotFoundError)
                send(res, 404, { error: e.message });
              else
                send(res, 500, {
                  error: e instanceof Error ? e.message : String(e),
                });
            }
            return;
          }
          if (req.method === 'DELETE') {
            try {
              await adminDeletePost(boardStore, cityId, postId);
              send(res, 200, { ok: true });
            } catch (e) {
              if (e instanceof BoardNotFoundError)
                send(res, 404, { error: e.message });
              else
                send(res, 500, {
                  error: e instanceof Error ? e.message : String(e),
                });
            }
            return;
          }
          send(res, 405, { error: 'Method Not Allowed' });
          return;
        }

        send(res, 404, { error: 'Unknown admin endpoint' });
      });

      // /api/board/:city  and  /api/board/:city/:postId — custom matcher
      // (the prefix form `server.middlewares.use('/api/board', ...)` has
      // been flaky for us under Vite 5's HTML-first middleware order).
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        const listMatch = path.match(/^\/api\/board\/([^/]+)\/?$/);
        const itemMatch = path.match(/^\/api\/board\/([^/]+)\/([^/]+)\/?$/);
        if (!listMatch && !itemMatch) return next();

        const cityId = (listMatch ?? itemMatch)![1];
        const postId = itemMatch ? itemMatch[2] : null;

        const {
          isValidCityId,
          listPosts,
          createPost,
          updatePost,
          deletePost,
          BoardValidationError,
          BoardForbiddenError,
          BoardNotFoundError,
        } = await import('./src/server/board-handler');

        if (!isValidCityId(cityId)) {
          send(res, 404, { error: 'Unknown city' });
          return;
        }

        // Collection: /api/board/:city
        if (!postId) {
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
            let body: {
              nickname: string;
              studentClass: string;
              content: string;
            };
            try {
              body = JSON.parse(await readBody(req));
            } catch {
              send(res, 400, { error: 'Invalid JSON body' });
              return;
            }
            try {
              const result = await createPost(boardStore, cityId, body);
              send(res, 201, result);
            } catch (e) {
              const status = e instanceof BoardValidationError ? 400 : 500;
              send(res, status, {
                error: e instanceof Error ? e.message : String(e),
              });
            }
            return;
          }

          send(res, 405, { error: 'Method Not Allowed' });
          return;
        }

        // Item: /api/board/:city/:postId
        if (req.method === 'DELETE') {
          let body: { editToken?: string };
          try {
            body = JSON.parse(await readBody(req));
          } catch {
            send(res, 400, { error: 'Invalid JSON body' });
            return;
          }
          try {
            await deletePost(boardStore, cityId, postId, body.editToken ?? '');
            send(res, 200, { ok: true });
          } catch (e) {
            let status = 500;
            if (e instanceof BoardForbiddenError) status = 403;
            else if (e instanceof BoardNotFoundError) status = 404;
            send(res, status, {
              error: e instanceof Error ? e.message : String(e),
            });
          }
          return;
        }

        if (req.method === 'PATCH') {
          let body: {
            editToken: string;
            nickname?: string;
            studentClass?: string;
            content?: string;
          };
          try {
            body = JSON.parse(await readBody(req));
          } catch {
            send(res, 400, { error: 'Invalid JSON body' });
            return;
          }
          try {
            const post = await updatePost(boardStore, cityId, postId, body);
            send(res, 200, { post });
          } catch (e) {
            let status = 500;
            if (e instanceof BoardValidationError) status = 400;
            else if (e instanceof BoardForbiddenError) status = 403;
            else if (e instanceof BoardNotFoundError) status = 404;
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
