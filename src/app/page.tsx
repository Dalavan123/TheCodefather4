import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* “Ikon” (bara en enkel ruta som placeholder) */}
        <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
          <div className="h-6 w-6 rounded bg-sky-400/60" />
        </div>

        <h1 className="text-3xl font-semibold text-white">TheCodeFather</h1>
        <p className="mt-2 text-slate-300">
          Din intelligenta dokumentassistent
        </p>

        {/* Card */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <Link
            href="/login"
            className="block w-full rounded-xl bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-400 transition"
          >
            Logga in
          </Link>

          <p className="mt-4 text-sm text-slate-300">
            Har du inget konto?{" "}
            <span className="text-sky-400">Skapa konto</span>
          </p>
        </div>
      </div>
    </main>
  );
}
