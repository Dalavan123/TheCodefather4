"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Conversation = {
  id: number;
  title: string;
  createdAt: string;
};

export default function ConversationsPage() {
  const router = useRouter();

  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConvos(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createConversation() {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Ny konversation" }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data?.error ?? "Kunde inte skapa");
      return;
    }

    router.push(`/conversations/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Konversationer</h1>

          <button
            onClick={createConversation}
            className="rounded bg-cyan-500 px-4 py-2 text-sm text-black hover:bg-cyan-400"
          >
            + Ny
          </button>
        </div>

        {msg && <div className="mt-3 text-sm text-red-400">{msg}</div>}

        <div className="mt-6 space-y-3">
          {loading ? (
            <div>Laddar...</div>
          ) : convos.length === 0 ? (
            <div>Inga konversationer ännu.</div>
          ) : (
            convos.map(c => (
              <Link
                key={c.id}
                href={`/conversations/${c.id}`}
                className="block rounded border border-gray-800 bg-gray-900 p-4 hover:bg-gray-800/50"
              >
                <div className="font-medium">{c.title}</div>
                <div className="text-xs opacity-60">{c.createdAt}</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
