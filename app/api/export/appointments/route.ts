import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { csvLine } from "@/lib/csv";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId mancante" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, adminPassword: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant non trovato" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_auth_" + tenant.slug)?.value;
  if (authCookie !== tenant.adminPassword) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
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