import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const results: string[] = [];

  const sql = async (q: string) => {
    try { await prisma.$executeRawUnsafe(q); results.push(`OK: ${q.slice(0, 60)}...`); }
    catch (e: any) { results.push(`ERR: ${e.message.slice(0, 100)}`); }
  };

  await sql(`CREATE TABLE IF NOT EXISTS "Lead" (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, source TEXT DEFAULT 'web', status TEXT DEFAULT 'new', notes TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`);
  await sql(`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "referralCode" TEXT`);
  await sql(`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "referredByCode" TEXT`);
  await sql(`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "referredAt" TIMESTAMP`);

  return NextResponse.json({ results });
}
