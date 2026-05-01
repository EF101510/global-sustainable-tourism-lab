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
import Anthropic from '@anthropic-ai/sdk';
/**
 * Forwards the request to Anthropic and returns the SDK response unchanged.
 *
 * Design notes (kept here so we don't have to re-derive when tuning):
 * - **Model**: `claude-opus-4-7` — the lab's questions are open-ended and
 *   benefit from the most capable model. Override via `options.model` if
 *   cost becomes a concern.
 * - **Adaptive thinking**: `{type: "adaptive"}` lets Claude decide depth per
 *   request. The chat panel asks for ~200-word answers; the carrying-capacity
 *   estimator asks for a small JSON object. Both work cleanly with adaptive.
 *   `display: "summarized"` is intentionally *not* set — the front-end only
 *   reads `text` blocks, and Opus 4.7's default omits thinking text anyway,
 *   so leaving it omitted saves output tokens.
 * - **Effort**: `medium` — sweet spot for short educational answers; raise to
 *   `high` if response quality regresses on harder questions.
 * - **Prompt caching**: the system prompt is repeated turn-after-turn during
 *   a single chat conversation. A `cache_control: {type: "ephemeral"}` on
 *   the system block lets that prefix hit the cache on every follow-up turn.
 *   Below the model's minimum prefix length the marker is silently ignored
 *   (no error), so it's harmless when the prompt is short.
 * - **No streaming**: the front-end uses a single `fetch().json()` call, so
 *   we return the full response. `max_tokens: 16000` keeps generation under
 *   the SDK's HTTP timeout window for non-streamed requests.
 */
export function handleChat(body_1, _a) {
    return __awaiter(this, arguments, void 0, function (body, _b) {
        var client;
        var apiKey = _b.apiKey, _c = _b.model, model = _c === void 0 ? 'claude-opus-4-7' : _c;
        return __generator(this, function (_d) {
            client = new Anthropic({ apiKey: apiKey });
            return [2 /*return*/, client.messages.create({
                    model: model,
                    max_tokens: 16000,
                    thinking: { type: 'adaptive' },
                    output_config: { effort: 'medium' },
                    system: [
                        {
                            type: 'text',
                            text: body.system,
                            cache_control: { type: 'ephemeral' },
                        },
                    ],
                    messages: body.messages,
                })];
        });
    });
}
/** Map an Anthropic SDK error to an HTTP status the proxy should return. */
export function statusFromError(err) {
    var _a;
    if (err instanceof Anthropic.APIError)
        return (_a = err.status) !== null && _a !== void 0 ? _a : 500;
    return 500;
}
