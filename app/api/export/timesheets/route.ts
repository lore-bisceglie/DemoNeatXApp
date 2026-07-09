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
      include: { staff: true }
    });

    if (!tenant) {
      return new NextResponse("Tenant non trovato", { status: 404 });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

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

    let closedDaysArr: string[] = [];
    if (tenant.closedDays) {
      if (typeof tenant.closedDays === "string") {
        try { closedDaysArr = JSON.parse(tenant.closedDays); } catch(e) {}
      } else {
        closedDaysArr = tenant.closedDays as string[];
      }
    }

    const dayNameMapping: Record<number, string> = {
      0: "domenica", 1: "lunedì", 2: "martedì", 3: "mercoledì", 4: "giovedì", 5: "venerdì", 6: "sabato"
    };

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

    // Costruisci CSV
    let csv = "Data;Giorno;Dipendente;Stato Negozio;Ore Teoriche;Ore Ferie;Ore Pausa Extra;Note Assenze;Ore Effettive Lavorate\n";
    const monthName = firstDay.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

    for (const s of tenant.staff) {
      // Parsing del Google Sheet baseSchedule
      let scheduleObj: any = null;
      if (s.baseSchedule && s.baseSchedule.length > 5) {
        try {
          scheduleObj = JSON.parse(s.baseSchedule);
        } catch (e) {}
      }

      // Filtra le assenze per questo dipendente o quelle "per tutto il negozio" (staffId = null)
      const staffAbsences = absences.filter(a => a.staffId === s.id || !a.staffId);
      
      let totalExpected = 0;
      let totalFerie = 0;
      let totalPausa = 0;
      let totalWorked = 0;

      for (let d = 1; d <= lastDay.getDate(); d++) {
        // Correggiamo la timezone locale per non sbagliare giorno
        const dateLoop = new Date(year, month, d, 12, 0, 0);
        const dayIndex = dateLoop.getDay();
        const dayName = dayNameMapping[dayIndex];
        const dateStr = dateLoop.toISOString().split("T")[0]; // YYYY-MM-DD
        const dataIta = `${d.toString().padStart(2, '0')}/${(month+1).toString().padStart(2, '0')}/${year}`;

        let expectedHours = 0;
        let isClosed = closedDaysArr.includes(dayIndex) || closedDaysArr.includes(dayIndex.toString()) || closedDaysArr.includes(dayName);

        if (scheduleObj && scheduleObj[dayName] !== undefined) {
          // Ha un Google Sheet impostato per questo giorno
          const daySchedule = scheduleObj[dayName];
          if (daySchedule.active && daySchedule.blocks) {
            isClosed = false;
            let mins = 0;
            for (const b of daySchedule.blocks) {
              try {
                const [sh, sm] = b.start.split(":");
                const startM = parseInt(sh) * 60 + parseInt(sm);
                const [eh, em] = b.end.split(":");
                const endM = parseInt(eh) * 60 + parseInt(em);
                mins += Math.max(0, endM - startM);
              } catch (e) {}
            }
            expectedHours = mins / 60;
          } else {
            // Turno di riposo forzato da Google Sheet
            expectedHours = 0;
          }
        } else {
          // Nessun foglio Google: Fallback all'orario classico del negozio
          expectedHours = isClosed ? 0 : dailyWorkHours;
        }
        
        let ferieH = 0;
        let pausaH = 0;
        let notesArr: string[] = [];

        // Trova assenze per questo giorno esatto
        const dayAbsences = staffAbsences.filter(a => a.date === dateStr);
        for (const abs of dayAbsences) {
          if (abs.customerName.includes("FERIE")) {
            ferieH = expectedHours; // Se c'è ferie, brucia tutte le ore teoriche
            notesArr.push("Ferie Intera Giornata");
          } else if (abs.customerName.includes("PAUSA")) {
            if (abs.time && abs.endTime) {
              const [sh, sm] = abs.time.split(":");
              const startM = parseInt(sh) * 60 + parseInt(sm);
              const [eh, em] = abs.endTime.split(":");
              const endM = parseInt(eh) * 60 + parseInt(em);
              const p = Math.max(0, endM - startM) / 60;
              pausaH += p;
              notesArr.push(`Permesso ${abs.time}-${abs.endTime}`);
            }
          }
        }

        let workedHours = expectedHours - ferieH - pausaH;
        if (workedHours < 0) workedHours = 0;

        totalExpected += expectedHours;
        totalFerie += ferieH;
        totalPausa += pausaH;
        totalWorked += workedHours;

        const statoNegozio = isClosed ? "CHIUSO" : "Aperto";
        const notes = notesArr.length > 0 ? notesArr.join(", ") : "";

        csv += `"${dataIta}";"${dayName}";"${s.name}";"${statoNegozio}";${expectedHours.toFixed(2)};${ferieH.toFixed(2)};${pausaH.toFixed(2)};"${notes}";${workedHours.toFixed(2)}\n`;
      }

      // Riga di totale per il dipendente
      csv += `\n"TOTALE ${monthName.toUpperCase()}";;"${s.name}";;${totalExpected.toFixed(2)};${totalFerie.toFixed(2)};${totalPausa.toFixed(2)};;${totalWorked.toFixed(2)}\n\n`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="timesheet_${tenant.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${monthName.replace(/\s+/g, "_")}.csv"`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
