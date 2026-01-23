import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const isVercel = process.env.VERCEL === "1";

  if (isVercel) {
    // ✅ ta URL från DATABASE_URL först (du har den i Vercel)
    const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      console.error("❌ Missing Turso env vars on Vercel:", {
        DATABASE_URL: process.env.DATABASE_URL ? "OK" : "MISSING",
        TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "OK" : "MISSING",
        TURSO_AUTH_TOKEN: authToken ? "OK" : "MISSING",
      });
      throw new Error("Missing DATABASE_URL/TURSO_AUTH_TOKEN on Vercel");
    }

    // ✅ Viktigt: ge config till adapter direkt
    const adapter = new PrismaLibSql({ url, authToken });
    return new PrismaClient({ adapter, log: ["error"] });
  }

  // ✅ lokalt/CI -> vanlig sqlite (DATABASE_URL=file:...)
  return new PrismaClient({ log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
