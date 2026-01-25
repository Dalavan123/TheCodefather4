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

function pickBestLines(question: string, text: string, maxLines = 5) {
  const qWords = normalize(question)
    .split(" ")
    .filter(w => w.length >= 3);

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const scored = lines
    .map(line => {
      const n = normalize(line);
      const hits = qWords.reduce((acc, w) => acc + (n.includes(w) ? 1 : 0), 0);
      return { line, hits };
    })
    .filter(x => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, maxLines)
    .map(x => x.line);

  return scored;
}

export function buildFakeAiAnswer(question: string, chunks: ChunkHit[]) {
  if (!chunks.length) {
    return `Jag hittar inget som matchar din fråga just nu.\n\n👉 Prova att skriva mer specifikt (t.ex. namn, datum eller en rubrik som finns i dokumentet).`;
  }

  const topChunks = chunks.slice(0, 3);

  // plocka ut relevanta rader
  const bestLines: string[] = [];
  for (const c of topChunks) {
    const lines = pickBestLines(question, c.content, 3);
    for (const l of lines) {
      if (bestLines.length >= 6) break;
      if (!bestLines.includes(l)) bestLines.push(l);
    }
    if (bestLines.length >= 6) break;
  }

  // snyggare “källor”
  const sources = topChunks.map(c => {
    return `• ${c.document.title} (avsnitt ${c.chunkIndex + 1})`;
  });

  // om vi hittade bra rader
  if (bestLines.length > 0) {
    return `Här är det mest relevanta jag hittar 👇\n\n${bestLines
      .map(l => `• ${l}`)
      .join("\n")}\n\nKällor:\n${sources.join("\n")}`;
  }

  // fallback: visa snippet
  const topSource = chunks[0];
  const snippet =
    topSource.content.length > 500
      ? topSource.content.slice(0, 500) + "..."
      : topSource.content;

  return `Jag hittar relevant text i dokumenten, men inget som matchar exakt rad-för-rad.\n\nUtdrag:\n"${snippet}"\n\nKällor:\n${sources.join("\n")}`;
}