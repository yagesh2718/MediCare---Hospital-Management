// lib/prisma.js
import { PrismaClient } from "@/lib/generated/prisma";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // Optional: logs all Prisma queries
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
