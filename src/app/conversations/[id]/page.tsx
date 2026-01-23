"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Msg = {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export default function ConversationPage() {
  const params = useParams();
  const id = Number(params.id);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Scrolla ner när nya meddelanden kommer
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");

    // Optimistic UI: lägg in user direkt
    const tempUserId = Date.now();
    const tempAssistantId = Date.now() + 1;

    setMessages(prev => [
      ...prev,
      {
        id: tempUserId,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      },
      {
        id: tempAssistantId,
        role: "assistant",
        content: "Tänker... 🤖",
        createdAt: new Date().toISOString(),
      },
    ]);

    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Om det gick fel: ta bort placeholder
      setMessages(prev => prev.filter(m => m.id !== tempAssistantId));
      return;
    }

    // Ersätt placeholder med DB-svaret
    setMessages(prev =>
      prev.map(m => {
        if (m.id === tempAssistantId) return data.assistantMessage;
        return m;
      })
    );
  }

  return (
    // ✅ Viktigt: INTE min-h-screen här (LayoutWrapper har redan sin höjd/scroll)
    <main className="h-full bg-black text-white p-6 overflow-hidden">
      {/* ✅ min-h-0 gör att scroll kan fungera korrekt i barn */}
      <div className="mx-auto max-w-3xl h-full flex flex-col min-h-0">
        <h1 className="text-xl font-semibold mb-4 shrink-0">
          Konversation #{id}
        </h1>

        {/* ✅ Bara denna ska scrolla */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 rounded border border-gray-800 bg-gray-900 p-4">
          {loading ? (
            <div>Laddar...</div>
          ) : messages.length === 0 ? (
            <div>Inga meddelanden ännu.</div>
          ) : (
            messages.map(m => (
              <div
                key={m.id}
                className={`max-w-[75%] rounded px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-cyan-500 text-black"
                    : "mr-auto bg-gray-800 text-white"
                }`}
              >
                {m.content}
              </div>
            ))
          )}

          <div ref={bottomRef} />
        </div>

        {/* ✅ Input ska alltid synas (ingen scroll på sidan behövs) */}
        <div className="mt-4 flex gap-2 shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Skriv ett meddelande..."
            className="flex-1 rounded border border-gray-700 bg-black px-3 py-2 text-sm"
            onKeyDown={e => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            onClick={send}
            className="rounded bg-cyan-500 px-4 py-2 text-sm text-black hover:bg-cyan-400"
          >
            Skicka
          </button>
        </div>
      </div>
    </main>
  );
}
