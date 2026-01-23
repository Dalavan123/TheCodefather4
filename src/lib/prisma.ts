import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const isVercel = process.env.VERCEL === "1";

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (isVercel) {
    if (!tursoUrl || !tursoToken) {
      console.error("❌ Missing Turso env vars on Vercel:", {
        TURSO_DATABASE_URL: tursoUrl,
        TURSO_AUTH_TOKEN: tursoToken ? "OK" : "MISSING",
      });

      // VIKTIGT: krascha tydligt istället för att Prisma blir konstig
      throw new Error("Missing TURSO env vars on Vercel");
    }

    const libsql = createClient({ url: tursoUrl, authToken: tursoToken });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = new PrismaLibSql(libsql as any);

    return new PrismaClient({ adapter, log: ["error"] });
  }

  // lokalt/test: vanlig sqlite (DATABASE_URL)
  return new PrismaClient({ log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
