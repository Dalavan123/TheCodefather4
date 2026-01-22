import { prisma } from "@/lib/prisma";

function keywordsFromQuestion(q: string) {
  return q
    .toLowerCase()
    .replace(/[^a-zåäö0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 8);
}

export async function findRelevantChunks(question: string, take = 6, documentId?: number) {
  const keywords = keywordsFromQuestion(question);

  const chunks = await prisma.chunk.findMany({
    where: {
      ...(documentId ? { documentId } : {}),
      ...(keywords.length
        ? {
            OR: keywords.map((k) => ({
              content: { contains: k },
            })),
          }
        : {}),
    },
    take,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      chunkIndex: true,
      content: true,
      documentId: true,
      document: { select: { id: true, title: true } },
    },
  });

  

  return chunks;
}


export function buildContextBlock(
  chunks: Awaited<ReturnType<typeof findRelevantChunks>>
) {
  if (!chunks.length) return "INGEN KONTEXT HITTADE.";

  // Lägg in “källor” i prompten
  return chunks
    .map((c) => {
      return `KÄLLA: doc#${c.documentId} "${c.document.title}" chunk#${c.chunkIndex}\n${c.content}`;
    })
    .join("\n\n---\n\n");
}
