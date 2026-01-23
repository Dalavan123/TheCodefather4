export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionUser } from "@/backend/auth/session";



export async function GET() {
  const user = await getSessionUser();

  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: { id: user.id, email: user.email },
  });
}
