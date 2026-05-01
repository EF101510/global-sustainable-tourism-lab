import Anthropic from '@anthropic-ai/sdk';
/**
 * Shape the front-end posts to /api/chat. `system` is the per-city advisor
 * prompt assembled in `lib/chat-api.ts`; `messages` is the running multi-turn
 * conversation.
 */
export interface ChatRequestBody {
    system: string;
    messages: Anthropic.MessageParam[];
}
export interface ChatHandlerOptions {
    apiKey: string;
    model?: string;
}
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
export declare function handleChat(body: ChatRequestBody, { apiKey, model }: ChatHandlerOptions): Promise<Anthropic.Message>;
/** Map an Anthropic SDK error to an HTTP status the proxy should return. */
export declare function statusFromError(err: unknown): number;
