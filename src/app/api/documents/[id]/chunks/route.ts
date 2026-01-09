import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const documentId = Number(id);

  if (!Number.isFinite(documentId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const chunks = await prisma.chunk.findMany({
    where: { documentId },
    orderBy: { chunkIndex: "asc" },
    select: {
      id: true,
      chunkIndex: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ documentId, chunks });
}
