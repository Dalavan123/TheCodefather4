"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function register() {
    setMsg("Registering...");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error ?? "Register failed");
      return;
    }

    setMsg("✅ Konto skapat! Gå till Login.");
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-sm space-y-4 rounded border border-gray-800 bg-gray-900 p-5">
        <h1 className="text-xl">Register</h1>

        <input
          className="w-full rounded border border-gray-700 bg-black px-3 py-2"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded border border-gray-700 bg-black px-3 py-2"
          placeholder="password (min 6 tecken)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={register}
          className="w-full rounded bg-cyan-500 py-2 text-black"
        >
          Create account
        </button>

        {msg && <div className="text-sm opacity-90">{msg}</div>}

        <div className="text-sm opacity-80">
          Har du konto? <Link className="underline" href="/login">Logga in</Link>
        </div>
      </div>
    </main>
  );
}
