"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { isMyDocument } from "@/lib/docLogic";

type Doc = {
  id: number;
  title: string;
  userId: number; // behövs för ägarkoll
  uploaderEmail?: string | null;
  category?: string;
  status?: string;
  createdAt?: string;
};

// liten debounce-hook
function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("meeting_notes");
  const [msg, setMsg] = useState<string>("");

  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [meUserId, setMeUserId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sök + filter
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const debouncedQ = useDebouncedValue(q, 300);

  async function loadMe() {
    try {
      const res = await fetch("/api/auth/me", { method: "GET" });
      const data = await res.json();
      setMeUserId(data?.user?.id ?? null);
    } catch {
      setMeUserId(null);
    }
  }

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    if (filterCategory !== "all") params.set("category", filterCategory);
    if (filterStatus !== "all") params.set("status", filterStatus);

    const s = params.toString();
    return s ? `?${s}` : "";
  }, [debouncedQ, filterCategory, filterStatus]);

  async function loadDocs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents${queryString}`, {
        method: "GET",
      });
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    loadMe();
  }, []);

  // ladda docs varje gång query/filter ändras
  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

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

    // ✅ NYTT – rensa efter lyckad upload
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  function resetFilters() {
    setQ("");
    setFilterCategory("all");
    setFilterStatus("all");
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl mb-6 text-center">Documents</h1>

      {/* Upload */}
      <div className="mx-auto max-w-2xl rounded border border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
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

      {/* ✅ Sök + Filter */}
      <div className="mx-auto mt-6 max-w-2xl rounded border border-gray-800 bg-gray-900 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Sök i titel eller text..."
            className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-sm"
          />

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="rounded border border-gray-700 bg-black px-3 py-2 text-sm"
            title="Filter kategori"
          >
            <option value="all">Alla kategorier</option>
            <option value="meeting_notes">Mötesanteckningar</option>
            <option value="reports">Rapporter</option>
            <option value="docs">Dokumentation</option>
            <option value="project">Projekt</option>
            <option value="other">Övrigt</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded border border-gray-700 bg-black px-3 py-2 text-sm"
            title="Filter status"
          >
            <option value="all">Alla status</option>
            <option value="ready">ready</option>
            <option value="processing">processing</option>
            <option value="failed">failed</option>
          </select>

          <button
            onClick={resetFilters}
            className="rounded border border-gray-700 px-3 py-2 text-sm hover:bg-black"
            title="Rensa filter"
          >
            Rensa
          </button>
        </div>
      </div>

      {/* Lista dokument */}
      <h2 className="mt-10 mb-4 text-lg text-center">Alla dokument</h2>

      <div className="mx-auto max-w-2xl space-y-3">
        {loading ? (
          <div>Loading...</div>
        ) : docs.length === 0 ? (
          <div>Inga dokument matchar din sökning.</div>
        ) : (
          docs.map(d => {
            // OBS: använd alltid isMyDocument() – logiken är testad.
            const isMine = isMyDocument(meUserId, d.userId);

            return (
              <div
                key={d.id}
                className={`flex items-center justify-between rounded border px-4 py-3 bg-gray-900 ${
                  isMine
                    ? "border-gray-800 border-l-4 border-l-cyan-500/60"
                    : "border-gray-800"
                }`}
              >
                <div className="flex flex-col gap-1 flex-1">
                  <Link
                    href={`/documents/${d.id}`}
                    className="cursor-pointer hover:bg-gray-800/60 rounded p-2 -m-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{d.title}</span>
                      {d.status && (
                        <span className="opacity-70"> — {d.status}</span>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {d.category && (
                        <span className="uppercase tracking-wide text-gray-500">
                          {d.category.replaceAll("_", " ")}
                        </span>
                      )}

                      {isMine ? (
                        <span className="flex items-center gap-1 text-gray-300">
                          <span className="text-gray-500">•</span>
                          Uppladdad av dig
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <span className="text-gray-500">•</span>
                          {d.uploaderEmail ?? `User #${d.userId}`}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>

                {d.createdAt && (
                  <div
                    title="Uppladdad"
                    className="ml-4 text-xs text-gray-400 whitespace-nowrap tabular-nums self-start mt-1"
                  >
                    {new Date(d.createdAt).toLocaleString("sv-SE", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}

                {/* Delete endast för ägaren */}
                {isMine && (
                  <button
                    onClick={() => deleteDoc(d.id, d.title)}
                    className="ml-4 rounded border border-red-500 px-3 py-1 text-sm text-red-400 hover:bg-red-500 hover:text-black"
                    title="Delete document"
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
