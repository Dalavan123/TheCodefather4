import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("session")?.value);

  if (!userId) {
    return (
      <main className="p-6">
        <a className="underline" href="/login">
          Gå till login
        </a>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  const docs = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  return (
    <main className="p-6">
      <p className="mb-2 text-sm text-gray-600">Inloggad som: {user?.email}</p>

      <form action="/api/auth/logout" method="POST" className="mb-4">
        <button className="underline text-sm">Logga ut</button>
      </form>
      <h1 className="text-xl mb-4">Documents</h1>
      <ul>
        {docs.map(d => (
          <li key={d.id}>
            {d.title} — {new Date(d.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </main>
  );
}
