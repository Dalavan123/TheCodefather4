import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/backend/auth/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const documentId = Number(id);

  if (!Number.isFinite(documentId)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  // ✅ valfritt: kolla att dokumentet finns
  const docExists = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true },
  });

  if (!docExists) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const comments = await prisma.documentComment.findMany({
    where: { documentId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      userId: true,
      user: {
        select: { email: true },
      },
    },
  });

  // format lite enklare för frontend
  const out = comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    userId: c.userId,
    userEmail: c.user.email,
  }));

  return NextResponse.json(out);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const documentId = Number(id);

  if (!Number.isFinite(documentId)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const content = String(body?.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Comment is empty" }, { status: 400 });
  }

  // ✅ valfritt: kolla att dokumentet finns
  const docExists = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true },
  });

  if (!docExists) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const comment = await prisma.documentComment.create({
    data: {
      documentId,
      userId: user.id,
      content,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      userId: true,
      user: { select: { email: true } },
    },
  });

  return NextResponse.json(
    {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      userId: comment.userId,
      userEmail: comment.user.email,
    },
    { status: 201 }
  );
}
