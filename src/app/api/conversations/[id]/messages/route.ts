import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/backend/auth/session";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
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
  const aiProvider = body?.aiProvider === "gemini" ? "gemini" : "local"; // default: local


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


  // 3) Bestäm dokument att söka i
  let effectiveDocumentId: number | undefined = undefined;
  if (convo.documentId) {
    effectiveDocumentId = convo.documentId;
  } else {
    if (requestedDocId !== null && Number.isFinite(requestedDocId) && requestedDocId > 0) {
      const docExists = await prisma.document.findUnique({
        where: { id: requestedDocId },
        select: { id: true },
      });
      if (docExists) effectiveDocumentId = requestedDocId;
    }
  }

  // 4) Hämta relevanta chunks (alltid, för båda lägen)
  const hits = await findRelevantChunks(content, 6, effectiveDocumentId);

  // 5) Svara beroende på aiProvider
  let aiAnswer = "";
  let aiError = null;
  let sourcesJson: Array<{
    id: number;
    chunkIndex: number;
    documentId: number;
    documentTitle: string;
  }> | null = null;

  if (aiProvider === "gemini") {
    // Gemini-läge
    let docText = "";
    if (convo.documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: convo.documentId },
        select: { contentText: true },
      });
      docText = doc?.contentText || "";
    } else if (requestedDocId) {
      const doc = await prisma.document.findUnique({
        where: { id: requestedDocId },
        select: { contentText: true },
      });
      docText = doc?.contentText || "";
    }
    try {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) throw new Error("Missing Gemini API key");
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        systemInstruction:
          "You are an assistant. Answer the user's questions based ONLY on the provided text content. If the answer is not in the text, say you don't know.",
      });
      const prompt = `Context:\n${docText}\n\nUser: ${content}`;
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      });
      aiAnswer = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "I don't know.";
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      aiError = msg || "AI error";
      aiAnswer = aiError;
    }
  } else {
    // Lokal/RAG-läge
    aiAnswer = buildFakeAiAnswer(content, hits);
    sourcesJson = hits.map(h => ({
      id: h.id,
      chunkIndex: h.chunkIndex,
      documentId: h.documentId,
      documentTitle: h.document?.title || "",
    }));
  }


  // 6) Spara ASSISTANT message i DB
  const assistantMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "assistant",
      content: aiAnswer,
      sourcesJson: sourcesJson ? JSON.stringify(sourcesJson) : null,
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });


  // 7) (Bonus) Uppdatera titel om den fortfarande är default
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
    aiProvider,
  });
}
