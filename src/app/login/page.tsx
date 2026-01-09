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

    window.location.href = "/";
  }

  return (
    <main className="p-6">
      <h1 className="text-xl mb-4">Login</h1>

      <form onSubmit={onSubmit} className="space-y-2">
        <input
          className="border p-2 w-full"
          placeholder="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          type="password"
          placeholder="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="border px-4 py-2">Logga in</button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </main>
  );
}
