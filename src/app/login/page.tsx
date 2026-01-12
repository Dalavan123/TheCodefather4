"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Logga in</h1>
          <p className="text-sm text-slate-400 mt-2">Välkommen tillbaka!</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-slate-300">
              E-postadress
            </label>
            <input
              id="email"
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="namn@exempel.se"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-slate-300">
              Lösenord
            </label>
            <div className="relative">
              <input
                id="password"
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Ange ditt lösenord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? "true" : "false"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link 
              href="/forgot-password" 
              className="text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              Glömt lösenord?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded py-2.5 font-medium text-black transition ${
              loading ? "bg-cyan-300 cursor-not-allowed" : "bg-cyan-500 hover:bg-cyan-400"
            }`}
          >
            {loading ? "Loggar in..." : "Logga in"}
          </button>
        </form>

        {error && (
          <div 
            id="error-message"
            role="alert"
            className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-3"
          >
            {error}
          </div>
        )}

        <p className="text-center text-sm text-slate-300">
          Inget konto?{" "}
          <Link className="underline text-cyan-400 hover:text-cyan-300 transition" href="/register">
            Registrera dig här
          </Link>
        </p>
      </div>
    </main>
  );
}
