import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/backend/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      documentId: true,
      document: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(conversations);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // title: om den inte skickas -> default
  const rawTitle = typeof body?.title === "string" ? body.title.trim() : "";
  const title = rawTitle || "Ny konversation";

  // documentId: optional
  const hasDocumentId =
    body?.documentId !== undefined && body?.documentId !== null;

  let documentId: number | null = null;

  if (hasDocumentId) {
    const parsed = Number(body.documentId);

    // om documentId skickas men inte är giltigt -> 400 (istället för att skapa global)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return NextResponse.json({ error: "Invalid documentId" }, { status: 400 });
    }

    documentId = parsed;

    // kontrollera att dokumentet finns
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, title: true },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const convo = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: rawTitle ? rawTitle : `AI: ${doc.title}`,
        documentId: doc.id,
      },
      select: {
        id: true,
        title: true,
        documentId: true,
      },
    });

    return NextResponse.json(convo);
  }

  // Global konversation (ingen documentId)
  const convo = await prisma.conversation.create({
    data: {
      userId: user.id,
      title,
    },
    select: {
      id: true,
      title: true,
      documentId: true,
    },
  });

  return NextResponse.json(convo);
}
