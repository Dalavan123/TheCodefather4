"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Conversation = {
  id: number;
  title: string;
  createdAt: string;
  documentId: number | null;
  document?: { id: number; title: string } | null;
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
            convos.map(c => {
  const isGlobal = c.documentId === null;

  return (
    <Link
      key={c.id}
      href={`/conversations/${c.id}`}
      className="block rounded border border-gray-800 bg-gray-900 p-4 hover:bg-gray-800/50 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Titel */}
          <div className="font-medium truncate">{c.title}</div>

          {/* Typ: Global / Dokument */}
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {isGlobal ? (
              <span className="text-xs rounded-full border border-cyan-500/60 bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
                Global
              </span>
            ) : (
              <span className="text-xs rounded-full border border-purple-500/60 bg-purple-500/10 px-2 py-0.5 text-purple-200">
                Dokument: {c.document?.title ?? `#${c.documentId}`}
              </span>
            )}
          </div>
        </div>

        {/* Datum */}
        <div className="text-xs opacity-60 whitespace-nowrap">
          {new Date(c.createdAt).toLocaleString("sv-SE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </Link>
  );
})
          )}
        </div>
      </div>
    </main>
  );
}