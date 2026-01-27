"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Typer av AI-leverantörer
const AI_PROVIDERS = [
  { value: "local", label: "Fake AI" },
  { value: "gemini", label: "Gemini (Google AI)" },
];
import { useParams } from "next/navigation";

type Msg = {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type ConvoMeta = {
  id: number;
  title: string;
  documentId: number | null;
  document?: { id: number; title: string } | null;
};

type Doc = {
  id: number;
  title: string;
  category?: string;
  status?: string;
  createdAt?: string;
};

export default function ConversationPage() {

    // Nuvarande AI-leverantör
    const [aiProvider, setAiProvider] = useState<string>("local");
  const params = useParams();
  // URL-param kommer som string → konvertera till number för API-anrop
  const id = Number(params.id);

  // Meddelanden i konversationen
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Metadata om konversationen (titel, dokumentkoppling)
  const [convo, setConvo] = useState<ConvoMeta | null>(null);

  // Alla dokument (används för global sökning)
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docSearch, setDocSearch] = useState("");

  // Vilket dokument frågan ska gälla (null = alla dokument)
  const [scopeDocId, setScopeDocId] = useState<number | null>(null);

  // Används för att auto-scrolla till senaste meddelandet
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ======= LOADERS =======

  async function loadMessages() {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`, {
        cache: "no-store",
      });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function loadConvoMeta() {
    const res = await fetch(`/api/conversations/${id}`, { cache: "no-store" });
    const data = await res.json();

    if (res.ok) {
      setConvo(data);

      // Om konversationen är kopplad till ett dokument → lås scopen
      if (data.documentId) {
        setScopeDocId(data.documentId);
      }
    }
  }

  async function loadDocs() {
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/documents`, { cache: "no-store" });
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } finally {
      setDocsLoading(false);
    }
  }

  // Initial load när sidan öppnas eller id ändras
  useEffect(() => {
    if (!Number.isFinite(id)) return;

    loadConvoMeta();
    loadMessages();
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Scrolla automatiskt till botten när nya meddelanden kommer
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ======= SEND MESSAGE =======

  async function send() {
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");

    // Optimistic UI: visa direkt medan requesten pågår
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
      body: JSON.stringify({
        content: text,
        documentId: scopeDocId, // ✅ styr om vi söker i alla dokument eller valt dokument
        aiProvider,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Vid fel: ta bort placeholder
      setMessages(prev => prev.filter(m => m.id !== tempAssistantId));
      return;
    }

    // Ersätt placeholder med svaret från API:t
    setMessages(prev =>
      prev.map(m => {
        if (m.id === tempAssistantId) return data.assistantMessage;
        return m;
      }),
    );
  }

  // ======= DERIVED UI =======
  // UI-logik som beräknas från state (ingen egen state behövs)

  const isGlobalConvo = convo?.documentId === null || convo === null;

  const scopedDocTitle = useMemo(() => {
    if (!scopeDocId) return null;
    const found = docs.find(d => d.id === scopeDocId);
    return found?.title ?? `Dokument #${scopeDocId}`;
  }, [scopeDocId, docs]);

  const filteredDocs = useMemo(() => {
    const s = docSearch.trim().toLowerCase();
    if (!s) return docs;
    return docs.filter(d => d.title.toLowerCase().includes(s));
  }, [docs, docSearch]);

  // ======= UI =======

  return (
    <main className="h-full bg-black text-white p-6 overflow-hidden">
      <div className="mx-auto max-w-6xl h-full flex min-h-0 gap-4">
        {/* ================= LEFT: CHAT ================= */}
        <div className="flex-1 h-full flex flex-col min-h-0">
          {/* Header */}
          <div className="mb-3 shrink-0">
            <h1 className="text-xl font-semibold">
              {convo?.title ?? `Konversation #${id}`}
            </h1>

            {/* اختيار مزود الذكاء الاصطناعي */}
            <div className="mt-2 flex items-center gap-3">
              <label htmlFor="ai-provider" className="text-sm opacity-80">AI:</label>
              <select
                id="ai-provider"
                value={aiProvider}
                onChange={e => setAiProvider(e.target.value)}
                className="rounded border border-gray-700 bg-black px-2 py-1 text-sm"
              >
                {AI_PROVIDERS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Scope info */}
            <div className="mt-2 flex items-center gap-2 flex-wrap text-sm">
              {scopeDocId ? (
                <>
                  <span className="rounded-full border border-cyan-500/60 bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
                    Söker i: {scopedDocTitle}
                  </span>

                  {/* Om global convo får man rensa scope */}
                  {!convo?.documentId && (
                    <button
                      onClick={() => setScopeDocId(null)}
                      className="text-xs underline opacity-70 hover:opacity-100"
                    >
                      Rensa (sök i alla)
                    </button>
                  )}
                </>
              ) : (
                <span className="rounded-full border border-gray-700 bg-gray-800/40 px-2 py-0.5 text-gray-200">
                  Söker i alla dokument
                </span>
              )}
            </div>

            {/* Om konvo är dokument-kopplad, visa info */}
            {convo?.documentId && (
              <div className="mt-2 text-xs text-gray-400">
                Den här konversationen är kopplad till dokumentet och söker bara
                där.
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 rounded border border-gray-800 bg-gray-900 p-4">
            {loadingMessages ? (
              <div>Laddar...</div>
            ) : messages.length === 0 ? (
              <div>Inga meddelanden ännu.</div>
            ) : (
              messages.map(m => (
                <div
                  key={m.id}
                  className={`max-w-[75%] rounded px-4 py-2 text-sm whitespace-pre-wrap ${
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

          {/* Input */}
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

        {/* ================= RIGHT: DOC SIDEBAR (bara global) ================= */}
        {isGlobalConvo && (
          <aside className="w-[320px] shrink-0 hidden lg:flex flex-col min-h-0 rounded border border-gray-800 bg-gray-900 p-4">
            <div className="font-semibold mb-3">Dokument</div>

            <input
              value={docSearch}
              onChange={e => setDocSearch(e.target.value)}
              placeholder="Sök dokument..."
              className="rounded border border-gray-700 bg-black px-3 py-2 text-sm mb-3"
            />

            <div className="text-xs opacity-70 mb-2">
              Klicka på ett dokument för att fråga bara det.
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
              {docsLoading ? (
                <div className="text-sm">Laddar dokument...</div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-sm text-gray-300">
                  Inga dokument matchar sökningen.
                </div>
              ) : (
                filteredDocs.slice(0, 80).map(d => (
                  <button
                    key={d.id}
                    onClick={() => setScopeDocId(d.id)}
                    className={`w-full text-left rounded border px-3 py-2 text-sm transition ${
                      scopeDocId === d.id
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-gray-800 hover:bg-gray-800/40"
                    }`}
                    title="Välj dokument för nästa fråga"
                  >
                    <div className="font-medium truncate">{d.title}</div>
                    <div className="text-xs opacity-60">
                      ID: {d.id} {d.status ? `• ${d.status}` : ""}
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setScopeDocId(null)}
              className="mt-3 rounded border border-gray-700 px-3 py-2 text-sm hover:bg-black"
            >
              Sök i alla dokument
            </button>
          </aside>
        )}
      </div>
    </main>
  );
}
