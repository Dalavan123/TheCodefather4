import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-slate-900 text-white">
      <div className="w-full max-w-sm text-center space-y-6">
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
    </main>
  );
}
