import type { City, ChatMessage } from '../types';

/**
 * Read the proxy's error body if the response wasn't OK and surface a
 * useful message to the caller. The proxy returns `{error: string}` on
 * failure (both for missing-key 500s and for forwarded Anthropic errors
 * like 401/429/insufficient-credit), so this gives users an actionable
 * hint instead of a generic "proxy not running".
 */
async function throwFromResponse(response: Response): Promise<never> {
  let detail = '';
  try {
    const body = await response.json();
    detail = typeof body?.error === 'string' ? body.error : JSON.stringify(body);
  } catch {
    detail = await response.text().catch(() => '');
  }
  throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
}

function buildSystemPrompt(city: City): string {
  return `You are the AI sustainable-tourism advisor for the "Global Sustainable Tourism AI Lab," helping students analyze global tourism sustainability issues in English.

Current city the student is researching:
- City: ${city.name}, ${city.country}
- Brief: ${city.intro}
- Key challenges:
${city.issues.map((i) => `  ${i.icon} ${i.tag}: ${i.detail}`).join('\n')}

Answer in an educational, objective tone with concrete data and real cases. When you answer:
1. Always reply in English (this is an English-language learning lab).
2. Keep responses under 200 words, with clear points.
3. Cite real cases or feasible solutions where relevant.
4. End with one short follow-up question to keep the student thinking.
5. Format the response using Markdown — short \`###\` sub-headings for sections, \`**bold**\` for key terms, and \`- \` bullet lists for enumerations. The chat UI renders Markdown cleanly. Do not use \`#\` (h1) or large headings; keep things compact.`;
}

/**
 * Send a chat turn to the backend proxy. The proxy is responsible for
 * forwarding to Anthropic with a server-side API key — never call Anthropic
 * directly from the browser.
 *
 * Throws on network errors or non-200 responses; the caller renders a
 * friendly fallback message.
 */
export async function sendChatMessage(
  city: City,
  messages: ChatMessage[]
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: buildSystemPrompt(city),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!response.ok) await throwFromResponse(response);
  const data = await response.json();
  return (
    data.content?.find((c: { type: string }) => c.type === 'text')?.text ||
    data.text ||
    'Sorry, I cannot respond right now. Please try again later.'
  );
}

export interface CarryingCapacityEstimate {
  area: number;
  spacePerPerson: number;
  stayTime: number;
  actualVisitors: number;
  siteName?: string;
}

/**
 * Ask the AI for a fresh estimate of the carrying-capacity inputs for a
 * specific city. Returns parsed JSON; throws if the proxy is down or the
 * response can't be parsed.
 */
export async function estimateCarryingCapacity(
  city: City
): Promise<CarryingCapacityEstimate> {
  const systemPrompt = `You estimate tourism carrying-capacity inputs for the formula C = A × U_f / R_t.

Given a city, choose its single most pressured tourist site and return ONLY a JSON object — no prose, no markdown fences. Use realistic estimates from widely-known data:

{
  "siteName": string (e.g. "St. Mark's Square"),
  "area": number (m² of the focal site),
  "spacePerPerson": number (m² per visitor — lower for crowded sites, 0.5–5),
  "stayTime": number (typical visit duration in hours, 1–8),
  "actualVisitors": number (estimated peak daily visitor count)
}`;

  const userPrompt = `City: ${city.name}, ${city.country}
Brief: ${city.intro}
Key challenges:
${city.issues.map((i) => `- ${i.tag}: ${i.detail}`).join('\n')}

Return JSON only.`;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!response.ok) await throwFromResponse(response);
  const data = await response.json();
  const text: string =
    data.content?.find((c: { type: string }) => c.type === 'text')?.text ||
    data.text ||
    '';

  // The model may wrap its JSON in code fences or add commentary; pull out
  // the first balanced object.
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object in AI response');
  const parsed = JSON.parse(match[0]) as CarryingCapacityEstimate;

  if (
    typeof parsed.area !== 'number' ||
    typeof parsed.spacePerPerson !== 'number' ||
    typeof parsed.stayTime !== 'number' ||
    typeof parsed.actualVisitors !== 'number'
  ) {
    throw new Error('AI response missing required numeric fields');
  }
  return parsed;
}
