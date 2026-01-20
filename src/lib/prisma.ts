import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Tvinga användning av Turso i production
const isProduction = process.env.NODE_ENV === "production";

console.log("[Prisma] Environment:", process.env.NODE_ENV);
console.log("[Prisma] TURSO_DATABASE_URL finns:", !!process.env.TURSO_DATABASE_URL);
console.log("[Prisma] TURSO_AUTH_TOKEN finns:", !!process.env.TURSO_AUTH_TOKEN);

let prismaInstance: PrismaClient;

if (isProduction && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // I production, använd ALLTID Turso
  console.log("[Prisma] Ansluter till Turso (production)...");
  const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  prismaInstance = new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
} else if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // Development med Turso
  console.log("[Prisma] Ansluter till Turso (development)...");
  const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  prismaInstance = new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
} else {
  // Lokal databas för development
  console.log("[Prisma] Använder lokal databas");
  prismaInstance = new PrismaClient({
    log: ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
