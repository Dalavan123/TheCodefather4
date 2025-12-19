import { prisma } from "@/lib/prisma";

export async function getAllDocuments() {
  return prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      createdAt: true,
      userId: true,
    },
  });
}
