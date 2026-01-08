import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function chunkText(text: string, chunkSize = 1200, overlap = 200) {
  const clean = text.replace(/\r\n/g, "\n").trim();
  const chunks: string[] = [];

  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + chunkSize, clean.length);
    chunks.push(clean.slice(i, end));
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const category = String(formData.get("category") ?? "other");
    // MVP: tills ni har auth, använd en fast userId (eller skicka in userId från frontend)
    const userId = Number(formData.get("userId") ?? 1);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Enkel validering (ni kan tillåta .md också)
    const allowed = ["text/plain", "text/markdown", ""];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 415 }
      );
    }

    const text = await file.text();
    if (!text.trim()) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    // 1) Skapa Document
    const doc = await prisma.document.create({
      data: {
        userId,
        title: file.name,
        category,
        originalName: file.name,
        contentText: text,
        status: "processing",
      },
      select: { id: true },
    });

    // 2) Chunk:a + spara chunks
    const chunkStrings = chunkText(text);

    await prisma.chunk.createMany({
      data: chunkStrings.map((content, idx) => ({
        documentId: doc.id,
        chunkIndex: idx,
        content,
      })),
    });

    // 3) Markera klar
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "ready" },
    });

    return NextResponse.json({
      ok: true,
      documentId: doc.id,
      chunksCreated: chunkStrings.length,
    });
  } catch (err) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
