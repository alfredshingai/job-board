import { PrismaClient } from '@prisma/client';

/**
 * Single PrismaClient instance shared across the app.
 * (Import this everywhere instead of instantiating new clients.)
 */
export const prisma = new PrismaClient();
