import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Tvinga användning av Turso i production
const isProduction = process.env.NODE_ENV === "production";
const useTurso = isProduction || process.env.TURSO_DATABASE_URL;

console.log("[Prisma] Environment:", process.env.NODE_ENV);
console.log("[Prisma] Använder Turso:", useTurso);

let prismaInstance: PrismaClient;

if (useTurso && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // Använd Turso med adapter
  console.log("[Prisma] Ansluter till Turso...");
  const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  prismaInstance = new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
} else {
  // Använd lokal databas för development
  console.log("[Prisma] Använder lokal databas");
  prismaInstance = new PrismaClient({
    log: ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
