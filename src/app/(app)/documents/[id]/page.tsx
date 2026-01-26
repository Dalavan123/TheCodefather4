"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Doc = {
  id: number;
  title: string;
  category?: string;
  status?: string;
  createdAt?: string;
  userId?: number;
  originalName?: string | null;
  contentText?: string | null;
};

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  userEmail: string;
};

export default function DocumentDetailsPage() {
  const params = useParams();
  const id = Number(params.id);

  const [meUserId, setMeUserId] = useState<number | null>(null);

  const [doc, setDoc] = useState<Doc | null>(null);
  const [docLoading, setDocLoading] = useState(true);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canComment = useMemo(() => meUserId !== null, [meUserId]);

  const [expanded, setExpanded] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);

  async function loadMe() {
    try {
      const res = await fetch("/api/auth/me", { method: "GET" });
      const data = await res.json();
      setMeUserId(data?.user?.id ?? null);
    } catch {
      setMeUserId(null);
    }
  }

  useEffect(() => {
    if (expanded) setCommentsOpen(false);
  }, [expanded]);

  async function loadDoc() {
    setDocLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setDoc(null);
        setMsg(data?.error ?? "Kunde inte hämta dokument");
        return;
      }

      setDoc(data);
    } finally {
      setDocLoading(false);
    }
  }

  async function loadComments() {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}/comments`);
      const data = await res.json();

      if (!res.ok) {
        setComments([]);
        return;
      }

      setComments(Array.isArray(data) ? data : []);
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  useEffect(() => {
    if (!Number.isFinite(id)) return;

    loadMe();
    loadDoc();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function sendComment() {
    const text = input.trim();
    if (!text) return;

    if (!canComment) {
      setMsg("Du måste vara inloggad för att kommentera.");
      return;
    }

    setMsg("");
    setInput("");

    const tempId = Date.now();
    setComments(prev => [
      ...prev,
      {
        id: tempId,
        content: text,
        createdAt: new Date().toISOString(),
        userId: meUserId ?? -1,
        userEmail: "Du",
      },
    ]);

    const res = await fetch(`/api/documents/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setComments(prev => prev.filter(c => c.id !== tempId));
      setMsg(data?.error ?? "Kunde inte skicka kommentar");
      await loadMe();
      return;
    }

    setComments(prev => prev.map(c => (c.id === tempId ? data : c)));
  }

  async function deleteComment(commentId: number) {
    const ok = window.confirm("Radera denna kommentar?");
    if (!ok) return;

    const res = await fetch(`/api/documents/${id}/comments/${commentId}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMsg(data?.error ?? "Kunde inte radera kommentar");
      await loadMe();
      return;
    }

    setComments(prev => prev.filter(c => c.id !== commentId));
    setMsg("🗑️ Kommentar raderad");
  }

  return (
    <main className="h-full box-border bg-black text-white p-6 overflow-hidden">
      <div className="mx-auto max-w-4xl h-full min-h-0 flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex items-center justify-between shrink-0">
          <Link
            href="/documents"
            className="text-sm opacity-80 hover:opacity-100"
          >
            ← Tillbaka
          </Link>
          {msg && <div className="text-sm text-gray-300">{msg}</div>}
        </div>

        {/* Document card */}
        <div
          className={`rounded border border-gray-800 bg-gray-900 p-5 shrink-0 overflow-hidden ${
            expanded ? "flex flex-col h-[70vh]" : "max-h-[22vh] overflow-auto"
          }`}
        >
          {docLoading ? (
            <div>Laddar dokument...</div>
          ) : !doc ? (
            <div>Dokumentet hittades inte.</div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold">{doc.title}</h1>

                  <div className="mt-2 text-sm text-gray-300 flex flex-wrap gap-2">
                    {doc.category && (
                      <span className="rounded-full border border-gray-700 bg-black/40 px-2 py-0.5">
                        {doc.category}
                      </span>
                    )}
                    {doc.status && (
                      <span className="rounded-full border border-gray-700 bg-black/40 px-2 py-0.5">
                        {doc.status}
                      </span>
                    )}
                    {doc.createdAt && (
                      <span className="rounded-full border border-gray-700 bg-black/40 px-2 py-0.5">
                        {new Date(doc.createdAt).toLocaleString("sv-SE")}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpanded(v => !v)}
                  className={`text-xs rounded border px-2 py-1 hover:bg-gray-800 ${
                    expanded
                      ? "border-cyan-500 text-cyan-300"
                      : "border-gray-700 text-gray-200"
                  }`}
                >
                  {expanded ? "Stäng läs-läge" : "Öppna läs-läge"}
                </button>
              </div>

              {doc.contentText ? (
                <div className="mt-4 flex-1 min-h-0">
                  <pre
                    className={`whitespace-pre-wrap rounded border border-gray-800 bg-black/40 p-4 text-sm text-gray-200 overflow-auto h-full`}
                  >
                    {doc.contentText}
                  </pre>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Comments */}
        {!expanded && (
          <div className="rounded border border-gray-800 bg-gray-900 p-5 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold">Kommentarer</h2>
              <span className="text-sm opacity-70">{comments.length} st</span>
            </div>

            <div className="mt-4 flex-1 min-h-0 overflow-y-auto rounded border border-gray-800 bg-black/30 p-4 space-y-3">
              {commentsLoading ? (
                <div>Laddar kommentarer...</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-gray-300">
                  Inga kommentarer ännu. Bli först! ✨
                </div>
              ) : (
                comments.map(c => {
                  const mine = meUserId !== null && meUserId === c.userId;

                  return (
                    <div
                      key={c.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded px-4 py-2 text-sm ${
                          mine
                            ? "bg-cyan-500 text-black"
                            : "bg-gray-800 text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs opacity-80">
                            {mine ? "Du" : c.userEmail}
                          </span>

                          {mine && (
                            <button
                              onClick={() => deleteComment(c.id)}
                              className="text-xs underline opacity-80 hover:opacity-100"
                              title="Radera"
                            >
                              radera
                            </button>
                          )}
                        </div>

                        <div className="mt-1 whitespace-pre-wrap">
                          {c.content}
                        </div>

                        <div className="mt-2 text-[10px] opacity-70">
                          {new Date(c.createdAt).toLocaleString("sv-SE")}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={bottomRef} />
            </div>

            <div className="mt-4 flex gap-2 shrink-0">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  canComment
                    ? "Skriv en kommentar..."
                    : "Logga in för att kommentera"
                }
                disabled={!canComment}
                className="flex-1 rounded border border-gray-700 bg-black px-3 py-2 text-sm disabled:opacity-50"
                onKeyDown={e => {
                  if (e.key === "Enter") sendComment();
                }}
              />

              <button
                onClick={sendComment}
                disabled={!canComment}
                className="rounded bg-cyan-500 px-4 py-2 text-sm text-black hover:bg-cyan-400 disabled:opacity-50"
              >
                Skicka
              </button>
            </div>

            {!canComment && (
              <div className="mt-2 text-xs opacity-70 shrink-0">
                Du måste vara inloggad för att skriva kommentarer.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
