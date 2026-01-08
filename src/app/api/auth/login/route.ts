import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (!user || user.passwordHash !== password) {
    return NextResponse.json(
      { error: "Fel email eller lösenord" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", String(user.id), { httpOnly: true, path: "/" });
  return res;
}
