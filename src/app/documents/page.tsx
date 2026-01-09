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

    setMsg(
      `✅ Uploaded. documentId=${data.documentId}, chunks=${data.chunksCreated}`
    );

    // refetch dokumentlistan så du ser nya dokumentet direkt
    await loadDocs();
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Documents</h1>

      {/* Upload */}
      <div style={{ marginTop: 12 }}>
        <input
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="meeting_notes">Mötesanteckningar</option>
          <option value="reports">Rapporter</option>
          <option value="docs">Dokumentation</option>
          <option value="project">Projektbeskrivningar</option>
          <option value="other">Övrigt</option>
        </select>

        <button onClick={upload} style={{ marginLeft: 8 }}>
          Upload
        </button>

        <div style={{ marginTop: 8 }}>{msg}</div>
      </div>

      {/* Lista dokument */}
      <h2 style={{ marginTop: 24 }}>Alla dokument</h2>

      {loading ? (
        <div>Loading...</div>
      ) : docs.length === 0 ? (
        <div>Inga dokument ännu.</div>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {docs.map((d) => (
            <li key={d.id}>
              <Link href={`/documents/${d.id}`}>{d.title}</Link>
              {d.status ? <span style={{ opacity: 0.7 }}> — {d.status}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
