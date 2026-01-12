"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Doc = {
  id: number;
  title: string;
  userId: number; // behövs för ägarkoll
  uploaderEmail?: string | null;
  category?: string;
  status?: string;
  createdAt?: string;
};

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("meeting_notes");
  const [msg, setMsg] = useState<string>("");

  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [meUserId, setMeUserId] = useState<number | null>(null);

  async function loadDocs() {
    setLoading(true);
    try {
      const res = await fetch("/api/documents", { method: "GET" });
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

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
    loadMe();
    loadDocs();
  }, []);

  async function upload() {
    if (!file) return;

    setMsg("Uploading...");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);

    const res = await fetch("/api/documents/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error ?? "Upload failed");
      // om session dog: uppdatera me
      await loadMe();
      return;
    }

    setMsg("Uploaded ✅");
    await loadDocs();
  }

  async function deleteDoc(id: number, title: string) {
    const ok = window.confirm(`Är du säker att du vill radera "${title}"?`);
    if (!ok) return;

    const res = await fetch(`/api/documents/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error ?? "Delete failed");
      await loadMe();
      return;
    }

    setMsg(`🗑️ Deleted document ${id}`);
    await loadDocs();
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl mb-6 text-center">Documents</h1>

      {/* Upload */}
      <div className="mx-auto max-w-2xl rounded border border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <input
            id="file"
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />

          <label
            htmlFor="file"
            className="cursor-pointer rounded border border-gray-700 bg-gray-900 px-4 py-2 text-sm"
          >
            {file ? file.name : "Välj fil"}
          </label>

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
          >
            <option value="meeting_notes">Mötesanteckningar</option>
            <option value="reports">Rapporter</option>
            <option value="docs">Dokumentation</option>
            <option value="project">Projektbeskrivningar</option>
            <option value="other">Övrigt</option>
          </select>

          <button
            onClick={upload}
            disabled={meUserId === null}
            className={`rounded px-4 py-2 text-sm ${
              meUserId === null
                ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                : "bg-cyan-500 text-black"
            }`}
          >
            Upload
          </button>
        </div>

        {meUserId === null && (
          <div className="mt-3 text-sm opacity-80">
            Du måste vara inloggad för att ladda upp och radera dokument.
          </div>
        )}

        {msg && <div className="mt-3 text-sm">{msg}</div>}
      </div>

      {/* Lista dokument */}
      <h2 className="mt-10 mb-4 text-lg text-center">Alla dokument</h2>

      <div className="mx-auto max-w-2xl space-y-3">
        {loading ? (
          <div>Loading...</div>
        ) : docs.length === 0 ? (
          <div>Inga dokument ännu.</div>
        ) : (
          docs.map(d => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded border border-gray-800 bg-gray-900 px-4 py-3"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Link href={`/documents/${d.id}`} className="font-medium">
                    {d.title}
                  </Link>
                  {d.status && (
                    <span className="opacity-70"> — {d.status}</span>
                  )}
                </div>

                <div className="mt-1 text-xs text-gray-400">
                  Uppladdad av{" "}
                  <span className="inline-flex items-center rounded-full border border-gray-700 bg-black/40 px-2 py-0.5 text-gray-200">
                    {meUserId !== null && meUserId === d.userId
                      ? "Du"
                      : d.uploaderEmail ?? `User #${d.userId}`}
                  </span>
                </div>
              </div>

              {/* Delete endast för ägaren */}
              {meUserId !== null && meUserId === d.userId && (
                <button
                  onClick={() => deleteDoc(d.id, d.title)}
                  className="rounded border border-red-500 px-3 py-1 text-sm text-red-400 hover:bg-red-500 hover:text-black"
                  title="Delete document"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
