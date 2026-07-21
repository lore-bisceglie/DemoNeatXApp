import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { csvLine } from "@/lib/csv";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";
import { DEMO_TENANT_ID } from "@/lib/demoService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId mancante" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant non trovato" }, { status: 404 });
  }

  const authError = await requireTenantAdminOrDemo(request, tenantId, "export-customers", 20);
  if (authError) return authError;

  // Piano check: solo tenant con piano attivo o in trial possono esportare
  if (tenantId !== DEMO_TENANT_ID) {
    const exportTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, trialEndsAt: true, trialStatus: true },
    });
    const hasActivePaidPlan = exportTenant?.plan === "pro" || exportTenant?.plan === "elite";
    const hasActiveTrial = exportTenant?.trialEndsAt && new Date() <= exportTenant.trialEndsAt;
    if (!hasActivePaidPlan && !hasActiveTrial && exportTenant?.trialStatus !== "converted") {
      return NextResponse.json({ error: "Esportazione disponibile solo con abbonamento Pro o Elite attivo." }, { status: 403 });
    }
  }

  const [appointments, notes, noShows] = await Promise.all([
    prisma.appointment.findMany({
      where: { tenantId },
      include: { service: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customerNote.findMany({ where: { tenantId } }),
    prisma.noShow.findMany({ where: { tenantId } }),
  ]);

  const customers = new Map<string, {
    name: string; phone: string; visits: number; totalSpent: number;
    lastDate: string; noShows: number; note: string; preference: string;
  }>();

  appointments
    .filter((a) => !a.customerName.includes("PAUSA") && !a.customerName.includes("FERIE"))
    .forEach((appointment) => {
      const current = customers.get(appointment.customerPhone) || {
        name: appointment.customerName, phone: appointment.customerPhone,
        visits: 0, totalSpent: 0, lastDate: "", noShows: 0, note: "", preference: "",
      };
      current.name = appointment.customerName || current.name;
      current.visits += 1;
      current.totalSpent += appointment.service?.price || 0;
      if (!current.lastDate || appointment.date > current.lastDate) {
        current.lastDate = appointment.date;
      }
      customers.set(appointment.customerPhone, current);
    });

  noShows.forEach((item) => {
    const current = customers.get(item.customerPhone) || {
      name: item.customerName || "", phone: item.customerPhone,
      visits: 0, totalSpent: 0, lastDate: "", noShows: 0, note: "", preference: "",
    };
    current.noShows += 1;
    customers.set(item.customerPhone, current);
  });

  notes.forEach((note) => {
    const current = customers.get(note.phone) || {
      name: note.customerName || "", phone: note.phone,
      visits: 0, totalSpent: 0, lastDate: "", noShows: 0, note: "", preference: "",
    };
    current.note = note.note || "";
    current.preference = note.preference || "";
    current.name = note.customerName || current.name;
    customers.set(note.phone, current);
  });

  const rows = [
    csvLine(["Cliente", "Telefono", "Visite", "Totale stimato", "Ultimo appuntamento", "No-show", "Note", "Preferenze"]),
    ...Array.from(customers.values()).map((c) =>
      csvLine([c.name, c.phone, c.visits, c.totalSpent, c.lastDate, c.noShows, c.note, c.preference])
    ),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clienti.csv"',
    },
  });
}
