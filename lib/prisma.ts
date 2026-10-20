import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient } from "./generated/prisma/client";

// Reuse one client across dev hot reloads. The adapter only connects on the first query.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? "") });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function isUniqueViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
