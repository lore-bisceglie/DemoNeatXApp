import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Bypassa il pooler (6543) e usa la porta diretta (5432) per sbloccare Vercel
const getDirectUrl = () => {
  const url = process.env.DATABASE_URL || '';
  if (url.includes('6543')) {
    let newUrl = url.replace('6543/postgres?pgbouncer=true&connection_limit=1', '5432/postgres');
    newUrl = newUrl.replace('?pgbouncer=true', '');
    return newUrl;
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