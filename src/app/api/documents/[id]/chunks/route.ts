import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const documentId = Number(params.id);
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
