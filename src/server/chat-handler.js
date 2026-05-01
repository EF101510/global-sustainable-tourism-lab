var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var VALID_EFFORTS = [
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
];
export function isValidEffort(value) {
    return VALID_EFFORTS.includes(value);
}
/** Models that support adaptive thinking + the effort parameter. */
function supportsThinkingAndEffort(model) {
    // Haiku 4.5 returns 400 for both `thinking` and `output_config.effort`.
    // Conservative heuristic: only enable for Opus and Sonnet 4.6+ family.
    return /(?:opus-4|sonnet-4-)/.test(model);
}
/**
 * Forwards the request to Anthropic and returns the SDK response unchanged.
 *
 * Configurable via env vars (resolved by the caller — Vite middleware /
 * Vercel function — and passed in here):
 * - **model** (`ANTHROPIC_MODEL`) — see `.env.example` for choices.
 * - **effort** (`ANTHROPIC_EFFORT`) — `low|medium|high|xhigh|max` or empty.
 *
 * Adaptive thinking and the effort parameter are auto-disabled when the
 * configured model doesn't support them (e.g. Haiku 4.5), so swapping to a
 * cheaper model just works without any other code change.
 *
 * The system prompt gets `cache_control: ephemeral` so multi-turn chats
 * hit the prompt cache for every follow-up turn (~10% input cost on hits).
 * Below the model's minimum cacheable prefix the marker is silently
 * ignored — harmless when the prompt is short.
 */
export function handleChat(body_1, _a) {
    return __awaiter(this, arguments, void 0, function (body, _b) {
        var client, canThink;
        var apiKey = _b.apiKey, _c = _b.model, model = _c === void 0 ? 'claude-opus-4-7' : _c, effort = _b.effort;
        return __generator(this, function (_d) {
            client = new Anthropic({ apiKey: apiKey });
            canThink = supportsThinkingAndEffort(model);
            return [2 /*return*/, client.messages.create(__assign(__assign({ model: model, max_tokens: 16000, system: [
                        {
                            type: 'text',
                            text: body.system,
                            cache_control: { type: 'ephemeral' },
                        },
                    ], messages: body.messages }, (canThink ? { thinking: { type: 'adaptive' } } : {})), (canThink && effort ? { output_config: { effort: effort } } : {})))];
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
/**
 * Read ANTHROPIC_MODEL and ANTHROPIC_EFFORT from a generic env source
 * (works for Node `process.env` and Vite's `loadEnv` result alike).
 * Throws if effort is set to an invalid value, so a typo in `.env.local`
 * surfaces at startup instead of as a 400 from Anthropic.
 */
export function readChatConfig(env) {
    var _a, _b;
    var model = ((_a = env.ANTHROPIC_MODEL) === null || _a === void 0 ? void 0 : _a.trim()) || undefined;
    var rawEffort = ((_b = env.ANTHROPIC_EFFORT) === null || _b === void 0 ? void 0 : _b.trim()) || '';
    if (rawEffort && !isValidEffort(rawEffort)) {
        throw new Error("Invalid ANTHROPIC_EFFORT=\"".concat(rawEffort, "\". Must be one of: ").concat(VALID_EFFORTS.join(', '), ", or empty."));
    }
    return { model: model, effort: rawEffort ? rawEffort : undefined };
}
