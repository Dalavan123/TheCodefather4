import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const isVercel = process.env.VERCEL === "1";

  if (isVercel) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    console.error("PRISMA INIT ENV:", {
      VERCEL: process.env.VERCEL,
      TURSO_DATABASE_URL: url ? "OK" : "MISSING",
      TURSO_AUTH_TOKEN: authToken ? "OK" : "MISSING",
    });

    if (!url || !authToken) {
      throw new Error("Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN");
    }

    const adapter = new PrismaLibSql({ url, authToken });
    return new PrismaClient({ adapter, log: ["error"] });
  }

  return new PrismaClient({ log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
