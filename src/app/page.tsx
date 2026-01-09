import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">TheCodeFather</h1>

      <div className="flex gap-4">
        <Link href="/login" className="border px-4 py-2 rounded">
          Logga in
        </Link>
      </div>
    </main>
  );
}
