import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      originalName: true,
      contentText: true, // kan vara stor – men bra för debug
      createdAt: true,
      userId: true,
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
}
