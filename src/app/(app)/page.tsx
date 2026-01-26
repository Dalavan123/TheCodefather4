// src/app/(app)/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/backend/auth/session";

export default async function Home() {
  const user = await getSessionUser();

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded border border-gray-800 bg-gray-900 p-6 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="The Codefathers"
              width={140}
              height={140}
              priority
            />
          </div>

          <h1 className="text-3xl font-bold">TheCodeFather</h1>
          <p className="mt-2 text-sm text-gray-400">
            Dokumentassistent med dokument + konversationer.
          </p>

          {!user ? (
            <>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/login"
                  className="rounded bg-cyan-500 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-400"
                >
                  Logga in
                </Link>
                <Link
                  href="/register"
                  className="rounded border border-gray-700 px-4 py-2 text-sm hover:bg-black"
                >
                  Skapa konto
                </Link>
              </div>

              <div className="mt-6 text-sm text-gray-300">
                Du kan redan nu titta runt i{" "}
                <Link href="/documents" className="underline hover:opacity-80">
                  Dokument
                </Link>{" "}
                och{" "}
                <Link
                  href="/conversations"
                  className="underline hover:opacity-80"
                >
                  Konversationer
                </Link>
                . För att ladda upp dokument/ kommentera / skapa konversationer
                krävs inloggning.
              </div>
            </>
          ) : (
            <div className="mt-6 text-sm text-gray-300">
              Du är inloggad som{" "}
              <span className="font-medium">{user.email}</span>.
              <div className="mt-3 flex justify-center gap-3">
                <Link
                  href="/documents"
                  className="rounded bg-cyan-500 px-4 py-2 text-sm text-black hover:bg-cyan-400"
                >
                  Gå till Dokument
                </Link>
                <Link
                  href="/conversations"
                  className="rounded border border-gray-700 px-4 py-2 text-sm hover:bg-black"
                >
                  Gå till Konversationer
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
