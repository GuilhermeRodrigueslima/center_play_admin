import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const DEFAULT_POSTGRES_URL =
  'postgresql://neondb_owner:npg_85eJDpmWjUfx@ep-red-king-axq90d0r-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

const connectionUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  DEFAULT_POSTGRES_URL;

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = connectionUrl;
}

const prisma =
  global.__prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

export default prisma;
