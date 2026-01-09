"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Login failed");
        return;
      }

      // ✅ bättre än window.location.href i Next
      router.push("/documents");
      router.refresh();
    } catch {
      setError("Något gick fel. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-slate-900 text-white p-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Logga in</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            type="password"
            required
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded py-2 font-medium text-black transition ${
              loading ? "bg-cyan-300 cursor-not-allowed" : "bg-cyan-500 hover:bg-cyan-400"
            }`}
          >
            {loading ? "Loggar in..." : "Logga in"}
          </button>
        </form>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        <p className="text-center text-sm text-slate-300">
          Inget konto?{" "}
          <Link className="underline text-cyan-400" href="/register">
            Registrera
          </Link>
        </p>
      </div>
    </main>
  );
}
