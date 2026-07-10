import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const errors: string[] = [];

  // Test: crea tenant minimale
  try {
    const t = await prisma.tenant.create({
      data: {
        name: "Debug Test",
        slug: `debug-${Date.now()}`,
        ownerName: "Debug",
        ownerEmail: "debug@test.com",
        plan: "basic",
        trialStatus: "demo",
        storeSettings: { create: { smsCredits: 10, maxConcurrentAppointments: 1 } },
      },
    });
    await prisma.tenant.delete({ where: { id: t.id } });
    errors.push("OK: tenant creato e cancellato");
  } catch (e: any) {
    errors.push(`ERR tenant: ${e.message}`);
  }

  // Test: lead
  try {
    const l = await prisma.lead.create({ data: { name: "Debug" } });
    await prisma.lead.delete({ where: { id: l.id } });
    errors.push("OK: lead creato e cancellato");
  } catch (e: any) {
    errors.push(`ERR lead: ${e.message}`);
  }

  // Test: webhook Stripe
  try {
    const stripe = (await import('@/lib/stripe')).stripe;
    errors.push("OK: stripe importato");
  } catch (e: any) {
    errors.push(`ERR stripe: ${e.message}`);
  }

  return NextResponse.json({ errors });
}
