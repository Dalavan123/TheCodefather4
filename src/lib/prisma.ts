import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  // ENDAST på Vercel (NODE_ENV=production): använd Turso
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (tursoUrl && tursoToken) {
      const libsql = createClient({ url: tursoUrl, authToken: tursoToken });
      const adapter = new PrismaLibSql(libsql as any);
      return new PrismaClient({ adapter, log: ["error"] });
    }
  }

  // Lokalt: använd SQLite
  return new PrismaClient({ log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
