"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      return;
    }

    window.location.href = "/documents";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-slate-900 text-white p-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Logga in</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full rounded bg-cyan-500 py-2 font-medium text-black hover:bg-cyan-400 transition"
          >
            Logga in
          </button>
        </form>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}
      </div>
    </main>
  );
}
