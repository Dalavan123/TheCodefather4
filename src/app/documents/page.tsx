"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { isMyDocument } from "@/lib/docLogic";
import { useRouter } from "next/navigation";

type Doc = {
  id: number;
  title: string;
  userId: number; // behövs för ägarkoll
  uploaderEmail?: string | null;
  category?: string;
  status?: string;
  createdAt?: string;
  commentsCount?: number;
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
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("meeting_notes");
  const [msg, setMsg] = useState<string>("");

  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [meUserId, setMeUserId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const CATEGORY_OPTIONS = [
    { value: "meeting_notes", label: "Mötesanteckningar" },
    { value: "reports", label: "Rapporter" },
    { value: "docs", label: "Dokumentation" },
    { value: "project", label: "Projektbeskrivningar" },
    { value: "other", label: "Övrigt" },
  ] as const;

  const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
    CATEGORY_OPTIONS.map(o => [o.value, o.label])
  ) as Record<string, string>;

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);

  // Sök + filter
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [onlyMine, setOnlyMine] = useState(false);

  const debouncedQ = useDebouncedValue(q, 300);

  const STATUS_OPTIONS = [
    { value: "ready", label: "Klar" },
    { value: "processing", label: "Bearbetar" },
    { value: "failed", label: "Misslyckades" },
  ] as const;

  const STATUS_LABEL: Record<string, string> = Object.fromEntries(
    STATUS_OPTIONS.map(o => [o.value, o.label])
  ) as Record<string, string>;

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
    if (onlyMine) params.set("mine", "1");

    const s = params.toString();
    return s ? `?${s}` : "";
  }, [debouncedQ, filterCategory, filterStatus, onlyMine]);

  async function loadDocs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents${queryString}`, {
        method: "GET",
        cache: "no-store",
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

    setMsg(""); // rensa gammal status
    setMsg("Laddar upp...");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);

    const res = await fetch("/api/documents/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error ?? "Uppladdning misslyckades");
      // om session dog: uppdatera me
      await loadMe();
      return;
    }

    setMsg("Uppladdat ✅");
    await loadDocs();

    setTimeout(() => {
      setMsg("");
    }, 2500);

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
      setMsg(data?.error ?? "Radering misslyckades");
      await loadMe();
      return;
    }

    setMsg(`🗑️ Raderade dokument ${id}`);
    await loadDocs();
  }

  async function askAI(doc: Doc) {
    if (meUserId === null) {
      setMsg("Du måste vara inloggad för att använda AI-assistenten.");
      return;
    }

    setMsg("Skapar AI-konversation...");

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `AI: ${doc.title}`,
        documentId: doc.id, // ✅ kopplar konversationen till dokumentet
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error ?? "Kunde inte skapa konversation");
      return;
    }

    setMsg("");
    router.push(`/conversations/${data.id}`);
  }

  function resetFilters() {
    setQ("");
    setFilterCategory("all");
    setFilterStatus("all");
    setOnlyMine(false);
  }

  const sortedDocs = [...docs].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
  );

  // Drag and drop
  function isAllowedFile(f: File) {
    const okExt = /\.(txt|md)$/i.test(f.name);
    const okMime =
      f.type === "text/plain" || f.type === "text/markdown" || f.type === ""; // vissa .md kan komma som tom mime
    return okExt || okMime;
  }

  function setPickedFile(f: File | null) {
    if (!f) return;
    if (!isAllowedFile(f)) {
      setMsg("Endast .txt eller .md stöds");
      return;
    }
    setMsg("");
    setFile(f);
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl mb-6 text-center">Dokument</h1>

      {/* Upload */}
      <div className="mx-auto max-w-2xl rounded border border-gray-800 p-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id="file"
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          className="hidden"
          onChange={e => setPickedFile(e.target.files?.[0] ?? null)}
        />

        {/* Dropzone (rad 1) */}
        <div
          className={`rounded-lg border border-dashed px-6 py-8 text-center text-sm
      ${meUserId === null ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
      ${
        isDragging
          ? "border-cyan-500 bg-cyan-500/10"
          : "border-gray-700 bg-gray-900/70"
      }
    `}
          onClick={() => {
            if (meUserId === null) return;
            fileInputRef.current?.click();
          }}
          onDragOver={e => {
            e.preventDefault();
            e.stopPropagation();
            if (meUserId === null) return;
            setIsDragging(true);
          }}
          onDragLeave={e => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={e => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (meUserId === null) return;

            const f = e.dataTransfer.files?.[0] ?? null;
            setPickedFile(f);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (meUserId === null) return;
            if (e.key === "Enter" || e.key === " ")
              fileInputRef.current?.click();
          }}
          title="Dra och släpp en fil här, eller klicka för att välja"
        >
          <div className="opacity-90 font-medium">
            {file ? file.name : "Dra & släpp dokument"}
          </div>
          <div className="mt-1 text-xs opacity-70">
            {file
              ? "Klicka för att byta fil"
              : "eller klicka för att välja filer (.txt, .md)"}
          </div>
        </div>

        {/* Rad 2: Kategori + knapp under (som målbild-ish) */}
        <div className="mt-4 flex items-center justify-between gap-3">
          {/* Vänster: hint */}
          <div className="text-xs text-gray-500">
            Välj kategori och ladda upp
          </div>

          {/* Höger: kontroller */}
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-400">
                Kategori
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
              >
                {CATEGORY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={upload}
              disabled={meUserId === null || !file}
              className={`rounded-md px-5 py-2 text-sm font-semibold ${
                meUserId === null || !file
                  ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                  : "bg-cyan-500 text-black"
              }`}
            >
              Ladda upp
            </button>
          </div>
        </div>

        {meUserId === null && (
          <div className="mt-3 text-sm opacity-80">
            Du måste vara inloggad för att ladda upp och radera dokument.
          </div>
        )}

        {msg === "Uppladdat ✅" && (
          <div className="mt-3 text-xs text-green-400">✓ Uppladdat</div>
        )}
        {msg && msg !== "Uppladdat ✅" && (
          <div className="mt-3 text-sm">{msg}</div>
        )}
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
            {CATEGORY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded border border-gray-700 bg-black px-3 py-2 text-sm"
            title="Filter status"
          >
            <option value="all">Alla status</option>
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm whitespace-nowrap">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={e => setOnlyMine(e.target.checked)}
            />
            Mina dokument
          </label>

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
          <div>Laddar...</div>
        ) : sortedDocs.length === 0 ? (
          <div>Inga dokument matchar din sökning.</div>
        ) : (
          sortedDocs.map(d => {
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
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{d.title}</span>

                        {d.status && (
                          <span className="opacity-70">
                            {" "}
                            — {STATUS_LABEL[d.status] ?? d.status}
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-gray-300 rounded-full border border-gray-700 bg-black/40 px-2 py-0.5 whitespace-nowrap">
                        💬 {d.commentsCount ?? 0}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {d.category && (
                        <span className="uppercase tracking-wide text-gray-500">
                          {CATEGORY_LABEL[d.category] ?? d.category}
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
                          {d.uploaderEmail ?? `Användare #${d.userId}`}
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
                <button
                  onClick={() => askAI(d)}
                  disabled={meUserId === null}
                  className={`ml-4 rounded border px-3 py-1 text-sm whitespace-nowrap ${
                    meUserId === null
                      ? "border-gray-700 text-gray-500 cursor-not-allowed"
                      : "border-cyan-500 text-cyan-300 hover:bg-cyan-500 hover:text-black"
                  }`}
                  title="Ställ en fråga om detta dokument"
                >
                  Fråga AI
                </button>

                {/* Delete endast för ägaren */}
                {isMine && (
                  <button
                    onClick={() => deleteDoc(d.id, d.title)}
                    className="ml-4 rounded border border-red-500 px-3 py-1 text-sm text-red-400 hover:bg-red-500 hover:text-black"
                    title="Radera dokument"
                  >
                    Radera
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
