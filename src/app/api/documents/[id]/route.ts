import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/backend/auth/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = Number(id);

  if (!Number.isFinite(docId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const doc = await prisma.document.findUnique({
    where: { id: docId },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      createdAt: true,
      userId: true,
      originalName: true,
      contentText: true,
    },
  });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(doc);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = Number(id);

  if (!Number.isFinite(docId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // ✅ Kräver login
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doc = await prisma.document.findUnique({
    where: { id: docId },
    select: { id: true, userId: true },
  });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ✅ Endast ägaren får radera
  if (doc.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.document.delete({ where: { id: docId } });

  return NextResponse.json({ ok: true, deletedId: docId });
}
