import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const isProd = process.env.NODE_ENV === "production";

  // I prod (Vercel) måste vi ha URL + token
  if (isProd) {
    if (!url || !authToken) {
      console.error("❌ Missing DB env vars:", {
        DATABASE_URL: process.env.DATABASE_URL ? "OK" : "MISSING",
        TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "OK" : "MISSING",
        TURSO_AUTH_TOKEN: authToken ? "OK" : "MISSING",
      });
      throw new Error("Missing DATABASE_URL / TURSO_AUTH_TOKEN");
    }

    const libsql = createClient({ url, authToken });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = new PrismaLibSql(libsql as any);

    return new PrismaClient({ adapter, log: ["error"] });
  }

  // lokalt kan du köra sqlite fil om du vill
  return new PrismaClient({ log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
