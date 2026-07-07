import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Bypassa il pooler (6543) e usa la porta diretta (5432) per sbloccare Vercel
const getDirectUrl = () => {
  const url = process.env.DATABASE_URL || '';
  try {
    const parsed = new URL(url);
    if (parsed.port === '6543') {
      parsed.port = '5432';
      parsed.searchParams.delete('pgbouncer');
      parsed.searchParams.delete('connection_limit');
      return parsed.toString();
    }
  } catch (e) {
    // Ignore invalid URLs
  }
  return url;
};

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: getDirectUrl()
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma