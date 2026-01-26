"use client";

import { useEffect, useState } from "react";

type Health = {
  status: string;
  env: Record<string, string>;
  deploy: Record<string, string | null>;
  db: { ok: boolean; latencyMs: number | null; error: string | null };
  app: { uptimeMs: number; timestamp: string };
};

export default function DevopsPage() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">DevOps / Health</h1>
          <button
            onClick={load}
            className="rounded border border-gray-700 px-3 py-2 text-sm hover:bg-gray-900"
          >
            Uppdatera
          </button>
        </div>

        {loading ? (
          <div>Laddar...</div>
        ) : !data ? (
          <div>Kunde inte läsa /api/health</div>
        ) : (
          <>
            <div
              className={`rounded border p-4 ${
                data.status === "ok"
                  ? "border-green-600 bg-green-600/10"
                  : "border-yellow-600 bg-yellow-600/10"
              }`}
            >
              <div className="font-medium">
                Status:{" "}
                <span className="uppercase tracking-wide">{data.status}</span>
              </div>
              <div className="text-sm opacity-80">
                Tid: {new Date(data.app.timestamp).toLocaleString("sv-SE")}
              </div>
            </div>

            <div className="rounded border border-gray-800 bg-gray-900 p-4">
              <h2 className="font-semibold mb-2">Databas</h2>
              <div className="text-sm">
                {data.db.ok ? (
                  <>
                    ✅ DB OK{" "}
                    {data.db.latencyMs !== null && (
                      <span className="opacity-70">
                        ({data.db.latencyMs} ms)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    ❌ DB FEL{" "}
                    <div className="text-xs text-red-300 mt-2">
                      {data.db.error}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="rounded border border-gray-800 bg-gray-900 p-4">
              <h2 className="font-semibold mb-2">Miljövariabler</h2>
              <div className="space-y-1 text-sm">
                {Object.entries(data.env).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="opacity-70">{k}</span>
                    <span className="font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border border-gray-800 bg-gray-900 p-4">
              <h2 className="font-semibold mb-2">Deploy-info (Vercel)</h2>
              <div className="space-y-1 text-sm">
                {Object.entries(data.deploy).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="opacity-70">{k}</span>
                    <span className="font-mono truncate max-w-[60%]">
                      {v ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
