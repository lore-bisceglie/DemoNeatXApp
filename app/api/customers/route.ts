import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID mancante" }, { status: 400 });
  }

  try {
    const rawAppointments = await prisma.appointment.findMany({
      where: {
        tenantId: tenantId,
        customerName: { notIn: ["☕ PAUSA", "🌴 FERIE"] },
        customerPhone: { notIn: ["0000000000", "0000"] },
      },
      select: { customerPhone: true, customerName: true },
    });

    const rawNoShows = await prisma.noShow.findMany({
      where: { tenantId: tenantId },
      select: { customerPhone: true },
    });

    const map = new Map<string, { phone: string; name: string; visits: number; noShows: number }>();

    rawAppointments.forEach((app) => {
      const p = app.customerPhone;
      if (!map.has(p)) {
        map.set(p, { phone: p, name: app.customerName, visits: 1, noShows: 0 });
      } else {
        const existing = map.get(p)!;
        existing.visits += 1;
        map.set(p, existing);
      }
    });

    rawNoShows.forEach((ns) => {
      const p = ns.customerPhone;
      if (map.has(p)) {
        const existing = map.get(p)!;
        existing.noShows += 1;
        map.set(p, existing);
      }
    });

    const customers = Array.from(map.values()).sort((a, b) => b.visits - a.visits);

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Errore API Customers:", error);
    return NextResponse.json({ error: "Errore durante il recupero dei clienti" }, { status: 500 });
  }
}