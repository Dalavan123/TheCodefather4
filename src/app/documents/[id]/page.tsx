import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DocumentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;   // ✅ unwrap params
  const id = Number(idParam);

  if (!Number.isFinite(id)) notFound();

  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      createdAt: true,
      originalName: true,
      contentText: true,
      userId: true,
    },
  });

  if (!doc) notFound();

  const chunks = await prisma.chunk.findMany({
    where: { documentId: id },
    orderBy: { chunkIndex: "asc" },
    select: { id: true, chunkIndex: true, content: true },
  });

  return (
    <div style={{ padding: 16 }}>
      <Link href="/documents">← Back</Link>
      <h1 style={{ marginTop: 12 }}>{doc.title}</h1>

      <div style={{ opacity: 0.8, marginTop: 8 }}>
        <div>Category: {doc.category}</div>
        <div>Status: {doc.status}</div>
        <div>Created: {new Date(doc.createdAt).toLocaleString()}</div>
      </div>

      <h2 style={{ marginTop: 20 }}>Chunks ({chunks.length})</h2>
      <ul style={{ paddingLeft: 18 }}>
        {chunks.map((c) => (
          <li key={c.id} style={{ marginBottom: 12 }}>
            <b>Chunk {c.chunkIndex}</b>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
              {c.content}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}