import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import type { ChatMessage, City } from '../types';
import { sendChatMessage } from '../lib/chat-api';

export default function AIChat({ city }: { city: City }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Reset chat when the user navigates to a different city.
  useEffect(() => {
    setMessages([]);
  }, [city.id]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const presetQuestions = [
    `What tourism crisis might ${city.name} face by 2030?`,
    `Which AI technologies could help reduce visitor flow in ${city.name}?`,
    `Compare ${city.name} with similar cities that successfully transitioned to sustainable tourism.`,
  ];

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const reply = await sendChatMessage(city, newMessages);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `⚠️ ${detail}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-700/40 backdrop-blur-3xl backdrop-saturate-[180%] rounded-2xl border border-white/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/20 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan-300" />
        <h3 className="text-sm font-semibold text-white">AI Sustainability Diagnosis</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/70 mb-3">Pick a question to start, or ask your own:</p>
            {presetQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                className="w-full text-left text-xs text-white/90 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 border border-white/10 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-cyan-500/80 text-white rounded-br-sm'
                  : 'bg-white/20 text-white rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/20 px-3 py-2 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/20">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Ask a question..."
            className="flex-1 bg-white/10 text-white placeholder-white/40 text-xs rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg px-3 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
