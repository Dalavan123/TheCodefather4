import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/backend/auth/session";

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, commentId } = await params;
  const documentId = Number(id);
  const cId = Number(commentId);

  if (!Number.isFinite(documentId) || !Number.isFinite(cId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const comment = await prisma.documentComment.findUnique({
    where: { id: cId },
    select: { id: true, userId: true, documentId: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // säkerställ att den hör till detta dokument
  if (comment.documentId !== documentId) {
    return NextResponse.json({ error: "Wrong document" }, { status: 400 });
  }

  // bara författaren får radera
  if (comment.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.documentComment.delete({ where: { id: cId } });

  return NextResponse.json({ ok: true, deletedId: cId });
}
