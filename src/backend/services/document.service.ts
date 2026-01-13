import { prisma } from "@/lib/prisma";

type GetDocumentsParams = {
  q?: string | null;
  category?: string | null;
  status?: string | null;
};

export async function getAllDocuments(params?: GetDocumentsParams) {
  const q = params?.q?.trim() ?? "";
  const category = params?.category?.trim() ?? "";
  const status = params?.status?.trim() ?? "";

  const docs = await prisma.document.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q } },
                { contentText: { contains: q } },
              ],
            }
          : {},
        category && category !== "all" ? { category } : {},
        status && status !== "all" ? { status } : {},
      ],
    },
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

  // enkelt för frontend
  return docs.map((d) => ({
    id: d.id,
    title: d.title,
    userId: d.userId,
    category: d.category,
    status: d.status,
    createdAt: d.createdAt,
    uploaderEmail: d.user?.email ?? null,
  }));
}
