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
        tenantId,
        customerPhone: { notIn: ["0000000000", "0000"] },
      },
      select: {
        customerPhone: true,
        customerName: true,
        date: true,
        service: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    });

    const rawNoShows = await prisma.noShow.findMany({
      where: { tenantId },
      select: { customerPhone: true },
    });

    const rawNotes = await prisma.customerNote.findMany({
      where: { tenantId },
    });

    const customersMap = new Map<
      string,
      {
        phone: string;
        name: string;
        visits: number;
        noShows: number;
        totalSpent: number;
        lastVisit: string | null;
        favoriteService: string | null;
        note: string;
        preference: string | null;
      }
    >();

    const serviceCounts = new Map<string, Map<string, number>>();

    rawAppointments.forEach((app) => {
      if (app.customerName.includes("PAUSA") || app.customerName.includes("FERIE")) {
        return;
      }

      const phone = app.customerPhone;
      const existing =
        customersMap.get(phone) ||
        {
          phone,
          name: app.customerName,
          visits: 0,
          noShows: 0,
          totalSpent: 0,
          lastVisit: null,
          favoriteService: null,
          note: "",
          preference: null,
        };

      existing.visits += 1;
      existing.totalSpent += app.service?.price || 0;

      if (!existing.lastVisit || app.date > existing.lastVisit) {
        existing.lastVisit = app.date;
        existing.name = app.customerName;
      }

      if (app.service?.name) {
        const counts = serviceCounts.get(phone) || new Map<string, number>();
        counts.set(app.service.name, (counts.get(app.service.name) || 0) + 1);
        serviceCounts.set(phone, counts);
      }

      customersMap.set(phone, existing);
    });

    rawNoShows.forEach((noShow) => {
      const existing = customersMap.get(noShow.customerPhone);
      if (!existing) return;
      existing.noShows += 1;
      customersMap.set(noShow.customerPhone, existing);
    });

    rawNotes.forEach((note) => {
      const existing =
        customersMap.get(note.phone) ||
        {
          phone: note.phone,
          name: note.customerName || "Cliente",
          visits: 0,
          noShows: 0,
          totalSpent: 0,
          lastVisit: null,
          favoriteService: null,
          note: "",
          preference: null,
        };

      existing.note = note.note;
      existing.preference = note.preference;
      if (note.customerName) existing.name = note.customerName;
      customersMap.set(note.phone, existing);
    });

    serviceCounts.forEach((counts, phone) => {
      const existing = customersMap.get(phone);
      if (!existing) return;

      existing.favoriteService =
        Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        existing.favoriteService;
      customersMap.set(phone, existing);
    });

    const customers = Array.from(customersMap.values()).sort(
      (a, b) => b.visits - a.visits
    );

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Errore API Customers:", error);
    return NextResponse.json(
      { error: "Errore durante il recupero dei clienti" },
      { status: 500 }
    );
  }
}
