import { prisma } from "@/lib/prisma";
export const dynamic = 'force-dynamic'

export default async function Home() {
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  return (
    <main style={{ padding: 24 }}>
      <h1>Documents</h1>
      <ul>
        {docs.map((d) => (
          <li key={d.id}>
            {d.title} — {new Date(d.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </main>
  );
}
