import Anthropic from '@anthropic-ai/sdk';

export interface ChatRequestBody {
  system: string;
  messages: Anthropic.MessageParam[];
}

export type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface ChatHandlerOptions {
  apiKey: string;
  /** Anthropic model id. Defaults to `claude-opus-4-7`. */
  model?: string;
  /** Reasoning effort. Pass `undefined` to omit (required for Haiku 4.5,
   *  which doesn't support the effort parameter). */
  effort?: EffortLevel;
}

const VALID_EFFORTS: readonly EffortLevel[] = [
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
];

export function isValidEffort(value: string): value is EffortLevel {
  return (VALID_EFFORTS as readonly string[]).includes(value);
}

/** Models that support adaptive thinking + the effort parameter. */
function supportsThinkingAndEffort(model: string): boolean {
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
export async function handleChat(
  body: ChatRequestBody,
  { apiKey, model = 'claude-opus-4-7', effort }: ChatHandlerOptions
): Promise<Anthropic.Message> {
  const client = new Anthropic({ apiKey });
  const canThink = supportsThinkingAndEffort(model);

  return client.messages.create({
    model,
    max_tokens: 16000,
    system: [
      {
        type: 'text',
        text: body.system,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: body.messages,
    ...(canThink ? { thinking: { type: 'adaptive' as const } } : {}),
    ...(canThink && effort ? { output_config: { effort } } : {}),
  });
}

/** Map an Anthropic SDK error to an HTTP status the proxy should return. */
export function statusFromError(err: unknown): number {
  if (err instanceof Anthropic.APIError) return err.status ?? 500;
  return 500;
}

/**
 * Read ANTHROPIC_MODEL and ANTHROPIC_EFFORT from a generic env source
 * (works for Node `process.env` and Vite's `loadEnv` result alike).
 * Throws if effort is set to an invalid value, so a typo in `.env.local`
 * surfaces at startup instead of as a 400 from Anthropic.
 */
export function readChatConfig(env: Record<string, string | undefined>): {
  model?: string;
  effort?: EffortLevel;
} {
  const model = env.ANTHROPIC_MODEL?.trim() || undefined;
  const rawEffort = env.ANTHROPIC_EFFORT?.trim() || '';
  if (rawEffort && !isValidEffort(rawEffort)) {
    throw new Error(
      `Invalid ANTHROPIC_EFFORT="${rawEffort}". Must be one of: ${VALID_EFFORTS.join(', ')}, or empty.`
    );
  }
  return { model, effort: rawEffort ? (rawEffort as EffortLevel) : undefined };
}
