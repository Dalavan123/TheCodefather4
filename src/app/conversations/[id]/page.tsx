"use client";

import { useEffect, useState } from "react";
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
  }, [id]);

  async function send() {
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");

    // Optimistic UI
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);

    await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    // hämta "riktiga" listan igen
    await loadMessages();
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-3xl flex flex-col h-[calc(100vh-48px)]">
        <h1 className="text-xl font-semibold mb-4">Conversation #{id}</h1>

        <div className="flex-1 overflow-y-auto space-y-3 rounded border border-gray-800 bg-gray-900 p-4">
          {loading ? (
            <div>Loading...</div>
          ) : messages.length === 0 ? (
            <div>Inga meddelanden ännu.</div>
          ) : (
            messages.map((m) => (
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
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv ett meddelande..."
            className="flex-1 rounded border border-gray-700 bg-black px-3 py-2 text-sm"
            onKeyDown={(e) => {
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