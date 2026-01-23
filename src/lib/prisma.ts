import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

let prismaSingleton: PrismaClient | null = null;

function createPrismaClient(): PrismaClient {
  const isVercel = process.env["VERCEL"] === "1";

  if (isVercel) {
    const url = process.env["TURSO_DATABASE_URL"];
    const authToken = process.env["TURSO_AUTH_TOKEN"];

    console.error("PRISMA INIT (LAZY):", {
      VERCEL: process.env["VERCEL"],
      TURSO_DATABASE_URL: url ? `OK(len=${url.length})` : "MISSING",
      TURSO_AUTH_TOKEN: authToken ? `OK(len=${authToken.length})` : "MISSING",
    });

    if (!url || !authToken) {
      throw new Error("Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN");
    }

    const adapter = new PrismaLibSql({ url, authToken });
    return new PrismaClient({ adapter, log: ["error"] });
  }

  return new PrismaClient({ log: ["error", "warn"] });
}

export function getPrisma(): PrismaClient {
  if (!prismaSingleton) prismaSingleton = createPrismaClient();
  return prismaSingleton;
}

// ✅ Kompatibilitet: så gamla imports fortsätter funka
export const prisma = getPrisma();
