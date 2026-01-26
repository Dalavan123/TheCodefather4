export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";

import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body?.password ?? "");
  const prisma = getPrisma();

  if (process.env.NODE_ENV === "development") {
    console.log("ENV CHECK:", {
      VERCEL: process.env.VERCEL,
      DATABASE_URL: process.env.DATABASE_URL ? "OK" : "MISSING",
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "OK" : "MISSING",
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? "OK" : "MISSING",
    });
  }

  if (!email || password.length < 6) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (err: unknown) {
    // ✅ Prisma: unique constraint (email already exists)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 },
        );
      }
    }

    // ✅ Jest-test: mockar felet som vanlig Error("Unique constraint")
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (msg.includes("unique constraint") || msg.includes("p2002")) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 },
        );
      }
    }

    console.error("REGISTER ERROR:", err);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
