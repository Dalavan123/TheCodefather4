import { prisma } from "@/lib/prisma";

function keywordsFromQuestion(q: string) {
  return q
    .toLowerCase()
    .replace(/[^a-zåäö0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(w => w.length >= 3)
    .slice(0, 10);
}

function scoreChunk(text: string, keywords: string[]) {
  const t = text.toLowerCase();
  let score = 0;

  for (const k of keywords) {
    
    const hits = t.split(k).length - 1;
    score += hits * 3;
  }

  
  if (text.length > 200 && text.length < 1200) score += 2;

  return score;
}

export async function findRelevantChunks(
  question: string,
  take = 6,
  documentId?: number
) {
  const keywords = keywordsFromQuestion(question);

  
  const candidates = await prisma.chunk.findMany({
    where: {
      ...(documentId ? { documentId } : {}),
      ...(keywords.length
        ? {
            OR: keywords.map(k => ({
              content: { contains: k },
            })),
          }
        : {}),
    },
    take: 40, 
    select: {
      id: true,
      chunkIndex: true,
      content: true,
      documentId: true,
      document: { select: { id: true, title: true } },
    },
  });

  
  const ranked = candidates
    .map(c => ({
      ...c,
      _score: scoreChunk(c.content, keywords),
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, take)
    .map(({ _score, ...rest }) => rest);

  return ranked;
}
