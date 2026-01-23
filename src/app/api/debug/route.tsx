export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    VERCEL: process.env.VERCEL,
    TURSO_DATABASE_URL_exists: Boolean(process.env.TURSO_DATABASE_URL),
    TURSO_AUTH_TOKEN_exists: Boolean(process.env.TURSO_AUTH_TOKEN),
  });
}
