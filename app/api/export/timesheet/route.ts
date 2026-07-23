import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { csvLine } from "@/lib/csv";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";
import { DEMO_TENANT_ID } from "@/lib/demoService";
import { parseBaseSchedule, parseShiftExceptions, getDayScheduleForDate, timeToMins } from "@/lib/schedule";

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

  const authError = await requireTenantAdminOrDemo(request, tenantId, "export-timesheet", 20);
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

  const staffMembers = await prisma.staff.findMany({
    where: { tenantId },
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // First day of current month
  const startDate = new Date(year, month, 1);
  // Last day of current month
  const endDate = new Date(year, month + 1, 0);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const appointments = await prisma.appointment.findMany({
    where: { 
      tenantId,
      date: {
        gte: startStr,
        lte: endStr
      }
    },
    select: {
      staffId: true,
      date: true,
      time: true,
      endTime: true,
      customerName: true
    }
  });

  const rows = [
    csvLine(["Dipendente", "Data", "Ore Teoriche", "Ore Effettive", "Note"])
  ];

  for (const staff of staffMembers) {
    const weeklySchedule = parseBaseSchedule(staff.baseSchedule);
    const exceptions = parseShiftExceptions(staff.shiftExceptions);
    
    for (let d = 1; d <= endDate.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = dateObj.toISOString().split("T")[0];
      
      const daySched = getDayScheduleForDate(weeklySchedule, exceptions, dateStr);
      
      let oreTeoriche = 0;
      if (daySched.active && daySched.blocks) {
        for (const b of daySched.blocks) {
          oreTeoriche += Math.max(0, timeToMins(b.end) - timeToMins(b.start)) / 60;
        }
      }

      // Trova appuntamenti (incluse le ferie)
      const dayApps = appointments.filter(a => a.staffId === staff.id && a.date === dateStr);
      let oreEffettive = 0;
      let note = daySched.exceptionNote || (!daySched.active ? "Riposo" : "");

      for (const app of dayApps) {
        if (app.customerName.toUpperCase().includes("FERIE") || app.time === "ALL_DAY") {
          note = "Ferie";
        } else if (app.time !== "ALL_DAY") {
          const startMins = timeToMins(app.time);
          const endMins = app.endTime ? timeToMins(app.endTime) : startMins + 15;
          oreEffettive += Math.max(0, endMins - startMins) / 60;
        }
      }

      if (note === "Ferie") {
        oreTeoriche = 0;
        oreEffettive = 0;
      }

      rows.push(csvLine([
        staff.name,
        dateStr,
        oreTeoriche.toFixed(2),
        oreEffettive.toFixed(2),
        note
      ]));
    }
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="timesheet_${year}_${month + 1}.csv"`,
    },
  });
}
