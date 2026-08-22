import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Configura banco de dados resiliente para Vercel Serverless
if (typeof process !== 'undefined') {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      const tmpDb = '/tmp/dev.db';
      const sourceDb = path.join(process.cwd(), 'prisma', 'dev.db');
      if (!fs.existsSync(tmpDb) && fs.existsSync(sourceDb)) {
        try {
          fs.copyFileSync(sourceDb, tmpDb);
        } catch (_) {}
      }
      process.env.DATABASE_URL = `file:${tmpDb}`;
    } else {
      process.env.DATABASE_URL = 'file:./dev.db';
    }
  }
}

const prisma =
  global.__prisma ||
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db',
  });

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

export default prisma;
