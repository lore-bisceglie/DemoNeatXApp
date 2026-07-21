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

  const authError = await requireTenantAdminOrDemo(request, tenantId, "export-appointments", 20);
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

  const appointments = await prisma.appointment.findMany({
    where: { tenantId },
    include: { service: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const rows = [
    csvLine(["Data", "Ora", "Cliente", "Telefono", "Servizio", "Prezzo", "Origine", "Pagato", "Creato Il"]),
    ...appointments.map((appointment) => {
      return csvLine([
        appointment.date,
        appointment.time,
        appointment.customerName,
        appointment.customerPhone,
        appointment.service?.name || "",
        appointment.service?.price?.toString() || "",
        appointment.source,
        appointment.isPaid ? "si" : "no",
        appointment.createdAt.toISOString(),
      ]);
    }),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="appuntamenti.csv"',
    },
  });
}
