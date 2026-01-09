"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Doc = {
  id: number;
  title: string;
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

  useEffect(() => {
    loadDocs();
  }, []);

  async function upload() {
    if (!file) return;

    setMsg("Uploading...");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    fd.append("userId", "1"); // tills ni har auth

    const res = await fetch("/api/documents/upload", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error ?? "Upload failed");
      return;
    }

    setMsg("Uploaded");
    await loadDocs();
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl mb-6 text-center">Documents</h1>

      {/* Upload */}
      <div className="mx-auto max-w-2xl rounded border border-gray-800 p-4">
        <div className="flex items-center gap-3">
          {/* Hidden file input */}
          <input
            id="file"
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />

          {/* Visible file button */}
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
            className="rounded bg-cyan-500 px-4 py-2 text-sm text-black"
          >
            Upload
          </button>
        </div>

        {msg && <div className="mt-3 text-sm">{msg}</div>}
      </div>

      {/* Lista dokument */}
      <h2 className="mt-10 mb-4 text-lg text-center">Mina dokument</h2>

      <div className="mx-auto max-w-2xl space-y-3">
        {loading ? (
          <div>Loading...</div>
        ) : docs.length === 0 ? (
          <div>Inga dokument ännu.</div>
        ) : (
          docs.map(d => (
            <div
              key={d.id}
              className="rounded border border-gray-800 bg-gray-900 px-4 py-3"
            >
              <Link href={`/documents/${d.id}`} className="font-medium">
                {d.title}
              </Link>
              {d.status && <span className="opacity-70"> — {d.status}</span>}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
