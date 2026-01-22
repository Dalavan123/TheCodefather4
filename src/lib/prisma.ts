import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makePrismaClient() {
  const isProduction = process.env.NODE_ENV === "production";

  // ✅ PRODUCTION (Vercel) => Turso
  if (isProduction) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      throw new Error(
        "Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in production env."
      );
    }

    const libsql = createClient({ url, authToken });
    const adapter = new PrismaLibSQL(libsql);

    return new PrismaClient({
      adapter,
      log: ["error"],
    });
  }

  // ✅ LOCAL => SQLite (DATABASE_URL=file:...)
  return new PrismaClient({
    log: ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
