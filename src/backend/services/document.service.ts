import { prisma } from "@/lib/prisma";

type GetDocumentsParams = {
  q?: string | null;
  category?: string | null;
  status?: string | null;
  mine?: string | null;
  userId?: number | null;
};

export async function getAllDocuments(params?: GetDocumentsParams) {
  const q = params?.q?.trim() ?? "";
  const category = params?.category?.trim() ?? "";
  const status = params?.status?.trim() ?? "";
  const mine = params?.mine === "1";
  const userId = params?.userId ?? null;

  if (mine && !userId) return [];

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
        mine && userId ? { userId } : {},
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
