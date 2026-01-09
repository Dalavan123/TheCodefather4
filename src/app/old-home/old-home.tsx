import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get("session")?.value);

  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
    : null;

  return (
    <main className="p-6">
      <div className="mb-4 flex items-center gap-4">
        {user ? (
          <>
            <p className="text-sm text-gray-600">Inloggad som: {user.email}</p>
            <form action="/api/auth/logout" method="POST">
              <button className="underline text-sm">Logga ut</button>
            </form>
          </>
        ) : (
          <Link className="underline text-sm" href="/login">
            Logga in
          </Link>
        )}
      </div>

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
