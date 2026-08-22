import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const connectionUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.NEON_DATABASE_URL;

if (connectionUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = connectionUrl;
}

const prisma =
  global.__prisma ||
  new PrismaClient(
    connectionUrl
      ? {
          datasources: {
            db: {
              url: connectionUrl,
            },
          },
        }
      : undefined
  );

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

export default prisma;
