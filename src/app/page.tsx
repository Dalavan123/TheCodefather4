import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-slate-900 text-white">
      {/* istället för att centrera exakt, flytta upp innehållet */}
      <div className="flex min-h-screen items-start justify-center pt-24 px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          {/* ✅ Stor logga */}
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="The Codefathers"
              width={200}
              height={200}
              priority
              className="drop-shadow-xl"
            />
          </div>

          <h1 className="text-3xl font-bold">TheCodeFather</h1>

          <p className="text-sm text-slate-400">
            Din intelligenta dokumentassistent
          </p>

          <Link
            href="/login"
            className="block w-full rounded bg-cyan-500 py-2 font-medium text-black hover:bg-cyan-400 transition"
          >
            Logga in
          </Link>
        </div>
      </div>
    </main>
  );
}
