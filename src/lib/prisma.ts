import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const isVercel = process.env.VERCEL === "1";

  if (isVercel) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      console.error("❌ Missing Turso env vars on Vercel:", {
        TURSO_DATABASE_URL: url ? "OK" : "MISSING",
        TURSO_AUTH_TOKEN: authToken ? "OK" : "MISSING",
      });
      throw new Error("Missing TURSO env vars");
    }

    const adapter = new PrismaLibSql({ url, authToken });
    return new PrismaClient({ adapter, log: ["error"] });
  }

  // lokalt: vanlig sqlite-fil (dev.db)
  return new PrismaClient({ log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
