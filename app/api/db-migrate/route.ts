import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const results: string[] = [];

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "referralCode" TEXT`);
    results.push('referralCode creato');
  } catch (e: any) { results.push(`referralCode: ${e.message}`); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "referredByCode" TEXT`);
    results.push('referredByCode creato');
  } catch (e: any) { results.push(`referredByCode: ${e.message}`); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "referredAt" TIMESTAMP`);
    results.push('referredAt creato');
  } catch (e: any) { results.push(`referredAt: ${e.message}`); }

  try {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_referralCode_key" ON "Tenant"("referralCode")`);
    results.push('unique index creato');
  } catch (e: any) { results.push(`index: ${e.message}`); }

  return NextResponse.json({ results });
}
