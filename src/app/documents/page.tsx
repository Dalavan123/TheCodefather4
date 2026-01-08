"use client";

import { useState } from "react";

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("meeting_notes");
  const [msg, setMsg] = useState<string>("");

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

    setMsg(`✅ Uploaded. documentId=${data.documentId}, chunks=${data.chunksCreated}`);
    // här kan du också trigga omhämtning av /api/documents om du listar docs på sidan
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Documents</h1>

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
    </div>
  );
}
