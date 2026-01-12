import { prisma } from "@/lib/prisma";

export async function getAllDocuments() {
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      userId: true,
      category: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  //enkelt för frontend
  return docs.map(d => ({
    id: d.id,
    title: d.title,
    userId: d.userId,
    category: d.category,
    status: d.status,
    createdAt: d.createdAt,
    uploaderEmail: d.user?.email ?? null,
  }));
}
