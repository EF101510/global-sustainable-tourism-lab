import type { City, ChatMessage } from '../types';

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
4. End with one short follow-up question to keep the student thinking.`;
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
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return (
    data.content?.find((c: { type: string }) => c.type === 'text')?.text ||
    data.text ||
    'Sorry, I cannot respond right now. Please try again later.'
  );
}
