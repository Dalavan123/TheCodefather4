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

// Liten debounce-hook för sökfältet så vi inte spammar API:t vid varje knapptryck.
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

  // Upload-state
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("meeting_notes");
  const [msg, setMsg] = useState<string>("");

  // Dokumentlista + inloggad användare
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [meUserId, setMeUserId] = useState<number | null>(null);

  // Används för att kunna rensa <input type="file"> efter lyckad upload.
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Visningsdata för kategorier (value -> label)
  const CATEGORY_OPTIONS = [
    { value: "meeting_notes", label: "Mötesanteckningar" },
    { value: "reports", label: "Rapporter" },
    { value: "docs", label: "Dokumentation" },
    { value: "project", label: "Projektbeskrivningar" },
    { value: "other", label: "Övrigt" },
  ] as const;

  // Snabb lookup för label i listan (för att slippa if/else överallt)
  const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
    CATEGORY_OPTIONS.map(o => [o.value, o.label]),
  ) as Record<string, string>;

  // Drag and drop-state (UI-feedback i dropzonen)
  const [isDragging, setIsDragging] = useState(false);

  // Sök + filter-state (påverkar query mot /api/documents)
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [onlyMine, setOnlyMine] = useState(false);

  // Debounce på söket för bättre UX och färre requests
  const debouncedQ = useDebouncedValue(q, 300);

  // Visningsdata för status (value -> label)
  const STATUS_OPTIONS = [
    { value: "ready", label: "Klar" },
    { value: "processing", label: "Bearbetar" },
    { value: "failed", label: "Misslyckades" },
  ] as const;

  const STATUS_LABEL: Record<string, string> = Object.fromEntries(
    STATUS_OPTIONS.map(o => [o.value, o.label]),
  ) as Record<string, string>;

  // Hämtar inloggad användare (för ägarkoll + låsa upp actions i UI)
  async function loadMe() {
    try {
      const res = await fetch("/api/auth/me", { method: "GET" });
      const data = await res.json();
      setMeUserId(data?.user?.id ?? null);
    } catch {
      // Om något går fel antar vi att användaren inte är inloggad
      setMeUserId(null);
    }
  }

  // Bygger querystring baserat på sök/filter. Memo för att bara ändras när input ändras.
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    if (filterCategory !== "all") params.set("category", filterCategory);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (onlyMine) params.set("mine", "1");

    const s = params.toString();
    return s ? `?${s}` : "";
  }, [debouncedQ, filterCategory, filterStatus, onlyMine]);

  // Hämtar dokumentlista utifrån aktuella filter
  async function loadDocs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents${queryString}`, {
        method: "GET",
        cache: "no-store", // vi vill alltid se senaste listan
      });
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  // Initial load av auth-state
  useEffect(() => {
    loadMe();
  }, []);

  // Ladda docs varje gång query/filter ändras
  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  // Upload av fil + category (FormData)
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
      // Om sessionen dog: uppdatera UI-läget för inloggning
      await loadMe();
      return;
    }

    setMsg("Uppladdat ✅");
    await loadDocs(); // uppdatera listan direkt

    // Rensa statusmeddelandet efter en stund för renare UI
    setTimeout(() => {
      setMsg("");
    }, 2500);

    // Rensa vald fil efter lyckad upload (både state och input-fält)
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Radera dokument (endast ägare) – med enkel bekräftelse
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

  // Skapar en konversation kopplad till valt dokument och navigerar dit
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
        documentId: doc.id, // kopplar konversationen till dokumentet
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

  // Återställ filter till standardläge
  function resetFilters() {
    setQ("");
    setFilterCategory("all");
    setFilterStatus("all");
    setOnlyMine(false);
  }

  // Sortera nyast först (UI-only, påverkar inte API)
  const sortedDocs = [...docs].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime(),
  );

  // Tillåt bara textfiler (både extension och mime, eftersom vissa .md kan sakna mime)
  function isAllowedFile(f: File) {
    const okExt = /\.(txt|md)$/i.test(f.name);
    const okMime =
      f.type === "text/plain" || f.type === "text/markdown" || f.type === "";
    return okExt || okMime;
  }

  // Gemensam hantering för file-picker och drag&drop
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

      {/* Upload-panel */}
      <div className="mx-auto max-w-2xl rounded border border-gray-800 p-4">
        {/* Hidden file input – triggas via klick på dropzone */}
        <input
          ref={fileInputRef}
          id="file"
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          className="hidden"
          onChange={e => setPickedFile(e.target.files?.[0] ?? null)}
        />

        {/* Dropzone: klick + drag&drop */}
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
            // Lås upload UI om man inte är inloggad
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
            // Grundläggande accessibility: Enter/Space öppnar filväljaren
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

        {/* Rad 2: Kategori + upload-knapp */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Välj kategori och ladda upp
          </div>

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

        {/* Tydlig feedback när man inte är inloggad */}
        {meUserId === null && (
          <div className="mt-3 text-sm opacity-80">
            Du måste vara inloggad för att ladda upp och radera dokument.
          </div>
        )}

        {/* Kort statusfeedback */}
        {msg === "Uppladdat ✅" && (
          <div className="mt-3 text-xs text-green-400">✓ Uppladdat</div>
        )}
        {msg && msg !== "Uppladdat ✅" && (
          <div className="mt-3 text-sm">{msg}</div>
        )}
      </div>

      {/* Sök + Filter */}
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
            // Viktigt: använd helpern som är testad (centralt ställe för ägarkoll)
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

                      {/* Visar antal kommentarer för snabb överblick */}
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

                      {/* Vem som laddat upp dokumentet */}
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

                {/* Datum visas om vi har createdAt */}
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
