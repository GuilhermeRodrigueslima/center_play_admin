import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const connectionUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (!connectionUrl) {
  throw new Error('DATABASE_URL é obrigatória para executar o painel.');
}

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
