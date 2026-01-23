import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (!tursoUrl || !tursoToken) {
      // Gör det supertydligt i Vercel logs om något saknas
      throw new Error(
        `Missing TURSO env vars. TURSO_DATABASE_URL=${tursoUrl}, TURSO_AUTH_TOKEN=${tursoToken ? "SET" : "MISSING"}`
      );
    }

    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = new PrismaLibSql(libsql as any);

    return new PrismaClient({
      adapter,
      log: ["error"],
    });
  }

  // Lokalt: SQLite
  return new PrismaClient({ log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
