import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Debug: Kontrollera miljövariabler
console.log("[Prisma] TURSO_DATABASE_URL finns:", !!process.env.TURSO_DATABASE_URL);
console.log("[Prisma] TURSO_AUTH_TOKEN finns:", !!process.env.TURSO_AUTH_TOKEN);
console.log("[Prisma] NODE_ENV:", process.env.NODE_ENV);

// Skapa Prisma LibSQL adapter
const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
