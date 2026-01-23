export const runtime = "nodejs";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    VERCEL: process.env.VERCEL ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "SET" : "MISSING",
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? "SET" : "MISSING",
    SESSION_SECRET: process.env.SESSION_SECRET ? "SET" : "MISSING",
  });
}
