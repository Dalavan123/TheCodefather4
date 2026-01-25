import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/backend/auth/session";
import { findRelevantChunks } from "@/backend/ai/rag";
import { buildFakeAiAnswer } from "@/backend/ai/fake-ai";

export const runtime = "nodejs";

// ✅ Hämta alla messages i en konversation
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isFinite(conversationId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // säkerställ att konversationen tillhör användaren
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userId: true },
  });

  if (!convo || convo.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const msgs = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json(msgs);
}

// ✅ Skapa user message + generera "fake ai" assistant message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isFinite(conversationId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const content = String(body?.content ?? "").trim();
  const rawDocId = body?.documentId;
  const requestedDocId =
    rawDocId === null || rawDocId === undefined ? null : Number(rawDocId);


  if (!content) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  // 1) Hämta konversationen + ev kopplat dokument
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      userId: true,
      title: true,
      documentId: true, // ✅ viktigt för dokument-chat
      document: { select: { id: true, title: true } },
    },
  });

  if (!convo || convo.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 2) Spara USER message i DB
  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content,
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  let effectiveDocumentId: number | undefined = undefined;

// Om konversationen redan är kopplad till dokument → lås den
if (convo.documentId) {
  effectiveDocumentId = convo.documentId;
} else {
  // Global konversation → tillåt att frågan skickar docId
  if (requestedDocId !== null && Number.isFinite(requestedDocId) && requestedDocId > 0) {
    // valfritt men snyggt: säkerställ att dokumentet finns
    const docExists = await prisma.document.findUnique({
      where: { id: requestedDocId },
      select: { id: true },
    });

    if (docExists) effectiveDocumentId = requestedDocId;
  }
}

  // 3) RAG: hitta relevanta chunks
  // Om convo.documentId finns → sök endast i det dokumentet
  const hits = await findRelevantChunks(content, 6, effectiveDocumentId);


  // 4) Bygg Fake-AI svar (utan OpenAI)
  const assistantContent = buildFakeAiAnswer(content, hits);

  // 5) Spara ASSISTANT message i DB + sourcesJson
  const assistantMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "assistant",
      content: assistantContent,
      sourcesJson: JSON.stringify(
        hits.map((c) => ({
          documentId: c.documentId,
          documentTitle: c.document.title,
          chunkIndex: c.chunkIndex,
          chunkId: c.id,
        }))
      ),
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  // 6) (Bonus) Uppdatera titel om den fortfarande är default
  // - Om kopplad till dokument: "AI: [DocTitle]"
  // - Annars: första 30 tecken av första frågan
  if (convo.title === "Ny konversation") {
    const newTitle = convo.document?.title
      ? `AI: ${convo.document.title}`
      : content.length > 30
      ? content.slice(0, 30) + "..."
      : content;

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: newTitle },
    });
  }

  return NextResponse.json({
    ok: true,
    userMessage,
    assistantMessage,
  });
}
