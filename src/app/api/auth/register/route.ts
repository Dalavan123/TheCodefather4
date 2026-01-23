import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || password.length < 6) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    // Prisma unique constraint
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    console.error("REGISTER ERROR:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
