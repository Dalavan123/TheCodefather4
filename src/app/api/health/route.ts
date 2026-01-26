import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function maskEnv(value: string | undefined) {
  // Visa aldrig hemligheter – bara om den finns
  return value ? "OK" : "MISSING";
}

export async function GET() {
  const startedAt = Date.now();

  // 1) Kolla env (utan att exponera secrets)
  const env = {
    NODE_ENV: process.env.NODE_ENV ?? "unknown",
    VERCEL: process.env.VERCEL ?? "0",
    TURSO_DATABASE_URL: maskEnv(process.env.TURSO_DATABASE_URL),
    TURSO_AUTH_TOKEN: maskEnv(process.env.TURSO_AUTH_TOKEN),
  };

  // 2) Deploy-info (Vercel sätter ofta dessa)
  const deploy = {
    vercelUrl: process.env.VERCEL_URL ?? null,
    gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  };

  // 3) DB-check (superbra att visa DevOps)
  let db = {
    ok: false,
    latencyMs: null as number | null,
    error: null as string | null,
  };

  try {
    const t0 = Date.now();
    // enkel query (billig men visar att DB är uppe)
    await prisma.user.findFirst({ select: { id: true } });
    db.ok = true;
    db.latencyMs = Date.now() - t0;
  } catch (e: unknown) {
    db.ok = false;
    db.error = e instanceof Error ? e.message : "Unknown DB error";
  }

  // 4) App-info
  const app = {
    uptimeMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  };

  const status = db.ok ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      env,
      deploy,
      db,
      app,
    },
    {
      status: db.ok ? 200 : 503,
      headers: {
        // Den här ska INTE cacheas – vill se “live”
        "Cache-Control": "no-store",
      },
    }
  );
}
