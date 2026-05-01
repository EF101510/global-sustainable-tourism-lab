var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
/**
 * Dev-only middleware that handles `POST /api/chat` by calling the same
 * shared handler that the production Vercel function uses. Loads the API
 * key from `.env` / `.env.local` via Vite's `loadEnv`. In production the
 * `api/chat.ts` serverless function takes over instead.
 */
function apiChatDevMiddleware(apiKey) {
    return {
        name: 'api-chat-dev',
        configureServer: function (server) {
            var _this = this;
            server.middlewares.use('/api/chat', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var body, _a, _b, _c, _d, handleChat, statusFromError, result, e_1, statusFromError;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            if (req.method !== 'POST') {
                                send(res, 405, { error: 'Method Not Allowed' });
                                return [2 /*return*/];
                            }
                            if (!apiKey) {
                                send(res, 500, {
                                    error: 'ANTHROPIC_API_KEY is not set. Add it to .env.local in the project root.',
                                });
                                return [2 /*return*/];
                            }
                            _e.label = 1;
                        case 1:
                            _e.trys.push([1, 3, , 4]);
                            _b = (_a = JSON).parse;
                            return [4 /*yield*/, readBody(req)];
                        case 2:
                            body = _b.apply(_a, [_e.sent()]);
                            return [3 /*break*/, 4];
                        case 3:
                            _c = _e.sent();
                            send(res, 400, { error: 'Invalid JSON body' });
                            return [2 /*return*/];
                        case 4:
                            _e.trys.push([4, 7, , 9]);
                            return [4 /*yield*/, import('./src/server/chat-handler')];
                        case 5:
                            _d = _e.sent(), handleChat = _d.handleChat, statusFromError = _d.statusFromError;
                            return [4 /*yield*/, handleChat(body, { apiKey: apiKey })];
                        case 6:
                            result = _e.sent();
                            send(res, 200, result);
                            return [3 /*break*/, 9];
                        case 7:
                            e_1 = _e.sent();
                            return [4 /*yield*/, import('./src/server/chat-handler')];
                        case 8:
                            statusFromError = (_e.sent()).statusFromError;
                            send(res, statusFromError(e_1), {
                                error: e_1 instanceof Error ? e_1.message : String(e_1),
                            });
                            return [3 /*break*/, 9];
                        case 9: return [2 /*return*/];
                    }
                });
            }); });
        },
    };
}
function readBody(req) {
    return new Promise(function (resolve, reject) {
        var chunks = [];
        req.on('data', function (c) { return chunks.push(c); });
        req.on('end', function () { return resolve(Buffer.concat(chunks).toString('utf8')); });
        req.on('error', reject);
    });
}
function send(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
}
export default defineConfig(function (_a) {
    var mode = _a.mode;
    // Pass `''` as prefix to load every variable, not just `VITE_*` — we need
    // the server-only `ANTHROPIC_API_KEY`. It's never inlined into the client
    // bundle because we don't reference `import.meta.env.ANTHROPIC_API_KEY`.
    var env = loadEnv(mode, process.cwd(), '');
    var apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    return {
        plugins: [react(), apiChatDevMiddleware(apiKey)],
        server: {
            port: 5173,
            open: true,
        },
    };
});
