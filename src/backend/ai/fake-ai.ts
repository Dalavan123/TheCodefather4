type ChunkHit = {
  id: number;
  chunkIndex: number;
  content: string;
  documentId: number;
  document: { id: number; title: string };
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBestLines(question: string, text: string, maxLines = 6) {
  const qWords = normalize(question)
    .split(" ")
    .filter((w) => w.length >= 3);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // scorad line = antal keywords som matchar
  const scored = lines
    .map((line) => {
      const n = normalize(line);
      const hits = qWords.reduce((acc, w) => acc + (n.includes(w) ? 1 : 0), 0);
      return { line, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, maxLines)
    .map((x) => x.line);

  return scored;
}

export function buildFakeAiAnswer(question: string, chunks: ChunkHit[]) {
  if (!chunks.length) {
    return `Jag hittade inget i dokumenten som matchar frågan:\n\n"${question}"\n\nTips: prova att fråga mer specifikt (t.ex. namn, datum, beslut).`;
  }

  // Plocka ut bra rader från de mest relevanta chunks
  const bestLines: string[] = [];
  for (const c of chunks.slice(0, 3)) {
    const lines = pickBestLines(question, c.content, 4);
    for (const l of lines) {
      if (bestLines.length >= 8) break;
      if (!bestLines.includes(l)) bestLines.push(l);
    }
    if (bestLines.length >= 8) break;
  }

  const topSource = chunks[0];

  const sources = chunks.slice(0, 3).map((c) => {
    return `• doc#${c.documentId} "${c.document.title}" (chunk#${c.chunkIndex})`;
  });

  // Om vi hittar “matchande rader” → presentera dem
  if (bestLines.length > 0) {
    return `Jag hittade detta som verkar relevant:\n\n${bestLines
      .map((l) => `- ${l}`)
      .join("\n")}\n\nKällor:\n${sources.join("\n")}`;
  }

  // annars visa ett utdrag från bästa chunk
  const snippet =
    topSource.content.length > 550
      ? topSource.content.slice(0, 550) + "..."
      : topSource.content;

  return `Jag hittade relevant text i dokumenten, här är ett utdrag:\n\n"${snippet}"\n\nKällor:\n${sources.join(
    "\n"
  )}`;
}
