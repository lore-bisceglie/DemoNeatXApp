import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return new NextResponse("Manca tenantId", { status: 400 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        staff: true
      }
    });

    if (!tenant) {
      return new NextResponse("Tenant non trovato", { status: 404 });
    }

    // Calcolo mese corrente (o un mese passato, per ora usiamo il mese corrente)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Primo e ultimo giorno del mese
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Gestione orari salone
    let openMins = 540; // 09:00
    if (tenant.openTime) {
      const [h, m] = tenant.openTime.split(":");
      openMins = parseInt(h) * 60 + parseInt(m);
    }

    let closeMins = 1140; // 19:00
    if (tenant.closeTime) {
      const [h, m] = tenant.closeTime.split(":");
      closeMins = parseInt(h) * 60 + parseInt(m);
    }

    let breakStartMins = 780; // 13:00
    let breakEndMins = 840;   // 14:00
    if (tenant.breakStart && tenant.breakEnd) {
      const [sh, sm] = tenant.breakStart.split(":");
      breakStartMins = parseInt(sh) * 60 + parseInt(sm);
      const [eh, em] = tenant.breakEnd.split(":");
      breakEndMins = parseInt(eh) * 60 + parseInt(em);
    }

    const dailyWorkMins = (closeMins - openMins) - (breakEndMins - breakStartMins);
    const dailyWorkHours = Math.max(0, dailyWorkMins / 60);

    // Chiusure fisse (closedDays)
    let closedDaysArr: string[] = [];
    if (tenant.closedDays) {
      if (typeof tenant.closedDays === "string") {
        try {
          closedDaysArr = JSON.parse(tenant.closedDays);
        } catch(e) {}
      } else {
        closedDaysArr = tenant.closedDays as string[];
      }
    }

    const dayNameMapping: Record<number, string> = {
      0: "domenica",
      1: "lunedì",
      2: "martedì",
      3: "mercoledì",
      4: "giovedì",
      5: "venerdì",
      6: "sabato",
    };

    // Conta giorni lavorativi nel mese
    let workingDaysInMonth = 0;
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateLoop = new Date(year, month, d);
      const dayName = dayNameMapping[dateLoop.getDay()];
      if (!closedDaysArr.includes(dayName)) {
        workingDaysInMonth++;
      }
    }

    const totalExpectedHours = workingDaysInMonth * dailyWorkHours;

    // Recupera assenze del mese
    const firstDayStr = firstDay.toISOString().split("T")[0];
    const lastDayStr = lastDay.toISOString().split("T")[0];

    const absences = await prisma.appointment.findMany({
      where: {
        tenantId,
        date: { gte: firstDayStr, lte: lastDayStr },
        OR: [
          { customerName: { contains: "FERIE" } },
          { customerName: { contains: "PAUSA" } }
        ]
      }
    });

    // Costruisci il CSV
    let csv = "Mese;Dipendente;Giorni Lavorativi Previsti;Ore Lavorative Previste;Giorni Ferie;Ore Pausa Extra;Ore Effettive Lavorate\n";
    const monthName = firstDay.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

    for (const s of tenant.staff) {
      const staffAbsences = absences.filter(a => a.staffId === s.id || !a.staffId);
      
      let ferieDays = 0;
      let pauseMins = 0;

      for (const abs of staffAbsences) {
        if (abs.customerName.includes("FERIE")) {
          ferieDays++;
        } else if (abs.customerName.includes("PAUSA")) {
          if (abs.time && abs.endTime) {
            const [sh, sm] = abs.time.split(":");
            const startM = parseInt(sh) * 60 + parseInt(sm);
            const [eh, em] = abs.endTime.split(":");
            const endM = parseInt(eh) * 60 + parseInt(em);
            pauseMins += Math.max(0, endM - startM);
          }
        }
      }

      const pauseHours = pauseMins / 60;
      const finalWorkedHours = totalExpectedHours - (ferieDays * dailyWorkHours) - pauseHours;

      csv += `"${monthName}";"${s.name}";${workingDaysInMonth};${totalExpectedHours.toFixed(2)};${ferieDays};${pauseHours.toFixed(2)};${finalWorkedHours.toFixed(2)}\n`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="foglio_presenze_${tenant.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${monthName.replace(" ", "_")}.csv"`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
