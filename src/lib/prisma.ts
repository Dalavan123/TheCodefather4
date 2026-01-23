import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const isVercel = process.env["VERCEL"] === "1"; // ✅ bracket access

  if (isVercel) {
    const url = process.env["TURSO_DATABASE_URL"];      // ✅ bracket access
    const authToken = process.env["TURSO_AUTH_TOKEN"];  // ✅ bracket access

    console.error("PRISMA INIT:", {
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

  // lokalt/CI: sqlite via schema dev.db
  return new PrismaClient({ log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
