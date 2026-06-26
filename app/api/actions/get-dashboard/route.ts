import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";

export async function GET() {
  const cookieStore = await cookies();
  if (!cookieStore.get("neatx_auth")) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = dateFormatter.formatToParts(now);
  const todayItaly = `${parts.find(p=>p.type==='year')?.value}-${parts.find(p=>p.type==='month')?.value}-${parts.find(p=>p.type==='day')?.value}`;

  const timeFormatter = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false });
  const [currentHours, currentMinutes] = timeFormatter.format(now).split(':').map(Number);
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  const rawAppointments = await prisma.appointment.findMany({
    where: { date: { gte: todayItaly }, tenantId: DEMO_TENANT_ID },
    orderBy: [{ date: 'asc' }, { time: 'asc' }]
  });

  const appointments = rawAppointments.filter((app) => {
    if (app.date > todayItaly) return true;
    if (app.time === "ALL_DAY") return true;
    const [appHours, appMinutes] = app.time.split(':').map(Number);
    return currentTotalMinutes <= (appHours * 60 + appMinutes) + 30;
  });

  return NextResponse.json({ appointments, todayItaly });
}
