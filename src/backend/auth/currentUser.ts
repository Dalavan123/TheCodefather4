import { cookies } from "next/headers";

export async function getCurrentUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("user_id")?.value;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}
