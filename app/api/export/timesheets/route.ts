import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { isTenantAdminCookieValid } from "@/lib/auth";
import { parseBaseSchedule, parseShiftExceptions, getDayScheduleForDate, timeToMins, dayIndexToName } from "@/lib/schedule";

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
      select: { id: true, slug: true, name: true, openTime: true, closeTime: true, breakStart: true, breakEnd: true, closedDays: true, staffSheetUrl: true, staff: { select: { id: true, name: true, baseSchedule: true, shiftExceptions: true } } }
    });

    if (!tenant) {
      return new NextResponse("Tenant non trovato", { status: 404 });
    }

    const cookieStore = await cookies();
    const authCookie = cookieStore.get("admin_auth_" + tenant.slug)?.value;
    if (!isTenantAdminCookieValid(authCookie, tenant.slug)) {
      return new NextResponse("Non autorizzato", { status: 401 });
    }

    if (!tenant) {
      return new NextResponse("Tenant non trovato", { status: 404 });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    let openMins = 540;
    if (tenant.openTime) {
      const [h, m] = tenant.openTime.split(":");
      openMins = parseInt(h) * 60 + parseInt(m);
    }

    let closeMins = 1140;
    if (tenant.closeTime) {
      const [h, m] = tenant.closeTime.split(":");
      closeMins = parseInt(h) * 60 + parseInt(m);
    }

    let breakStartMins = 780;
    let breakEndMins = 840;
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

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayStr = firstDay.toISOString().split("T")[0];
    const lastDayStr = lastDay.toISOString().split("T")[0];

    // Vecchie assenze da Appuntamenti (FERIE/PAUSA/PERMESSO — backward compat)
    const legacyAbsences = await prisma.appointment.findMany({
      where: {
        tenantId,
        date: { gte: firstDayStr, lte: lastDayStr },
        OR: [
          { customerName: { contains: "FERIE" } },
          { customerName: { contains: "PAUSA" } },
          { customerName: { contains: "PERMESSO" } },
        ]
      }
    });

    let csv = "Data;Giorno;Dipendente;Stato Negozio;Ore Teoriche;Ore Ferie;Ore Pausa;Ore Permesso;Note Assenze;Ore Effettive Lavorate\n";
    const monthName = firstDay.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

    for (const s of tenant.staff) {
      const weeklySchedule = parseBaseSchedule(s.baseSchedule);
      const shiftExceptions = parseShiftExceptions(s.shiftExceptions);

      const staffAbsences = legacyAbsences.filter(a => a.staffId === s.id || !a.staffId);

      let totalExpected = 0;
      let totalFerie = 0;
      let totalPausa = 0;
      let totalPermesso = 0;
      let totalWorked = 0;

      for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateLoop = new Date(year, month, d, 12, 0, 0);
        const dayIndex = dateLoop.getDay();
        const dayName = dayNameMapping[dayIndex];
        const dateStr = dateLoop.toISOString().split("T")[0];
        const dataIta = `${d.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;

        let expectedHours = 0;
        let isClosed = closedDaysArr.includes(dayIndex.toString()) || closedDaysArr.includes(dayName);

        if (Object.keys(weeklySchedule).length > 0) {
          // DB schedule (nuovo sistema)
          const daySchedule = getDayScheduleForDate(weeklySchedule, shiftExceptions, dateStr);
          if (daySchedule.active) {
            let mins = 0;
            for (const b of daySchedule.blocks) {
              mins += Math.max(0, timeToMins(b.end) - timeToMins(b.start));
            }
            expectedHours = mins / 60;
            isClosed = false;
          } else {
            expectedHours = 0;
          }
        } else {
          // Fallback orari tenant (nessun DB schedule)
          expectedHours = isClosed ? 0 : dailyWorkHours;
        }

        let ferieH = 0;
        let pausaH = 0;
        let permessoH = 0;
        let notesArr: string[] = [];

        // Eccezioni dal DB (nuovo sistema)
        const dayExceptions = shiftExceptions.filter(e => e.date === dateStr);
        for (const ex of dayExceptions) {
          if (ex.type === "ferie") {
            ferieH = Math.max(ferieH, expectedHours);
            notesArr.push("Ferie");
          } else if (ex.type === "permesso" && ex.start && ex.end) {
            const p = Math.max(0, timeToMins(ex.end) - timeToMins(ex.start)) / 60;
            permessoH += p;
            notesArr.push(`Permesso ${ex.start}-${ex.end}`);
          } else if (ex.type === "pausa" && ex.start && ex.end) {
            const p = Math.max(0, timeToMins(ex.end) - timeToMins(ex.start)) / 60;
            pausaH += p;
            notesArr.push(`Pausa ${ex.start}-${ex.end}`);
          }
        }

        // Legacy absences da appuntamenti (vecchio sistema)
        const dayAbsences = staffAbsences.filter(a => a.date === dateStr);
        for (const abs of dayAbsences) {
          if (abs.customerName.includes("FERIE")) {
            ferieH = expectedHours;
            if (!notesArr.includes("Ferie")) notesArr.push("Ferie (app.)");
          } else if (abs.customerName.includes("PERMESSO")) {
            if (abs.time && abs.endTime) {
              const p = Math.max(0, timeToMins(abs.endTime) - timeToMins(abs.time)) / 60;
              permessoH += p;
              notesArr.push(`Permesso ${abs.time}-${abs.endTime} (app.)`);
            }
          } else if (abs.customerName.includes("PAUSA")) {
            if (abs.time && abs.endTime) {
              const p = Math.max(0, timeToMins(abs.endTime) - timeToMins(abs.time)) / 60;
              pausaH += p;
              notesArr.push(`Pausa ${abs.time}-${abs.endTime} (app.)`);
            }
          }
        }

        let workedHours = expectedHours - ferieH - pausaH - permessoH;
        if (workedHours < 0) workedHours = 0;

        totalExpected += expectedHours;
        totalFerie += ferieH;
        totalPausa += pausaH;
        totalPermesso += permessoH;
        totalWorked += workedHours;

        const statoNegozio = isClosed ? "CHIUSO" : "Aperto";
        const notes = notesArr.length > 0 ? notesArr.join(", ") : "";

        csv += `"${dataIta}";"${dayName}";"${s.name}";"${statoNegozio}";${expectedHours.toFixed(2)};${ferieH.toFixed(2)};${pausaH.toFixed(2)};${permessoH.toFixed(2)};"${notes}";${workedHours.toFixed(2)}\n`;
      }

      csv += `\n"TOTALE ${monthName.toUpperCase()}";;"${s.name}";;${totalExpected.toFixed(2)};${totalFerie.toFixed(2)};${totalPausa.toFixed(2)};${totalPermesso.toFixed(2)};;${totalWorked.toFixed(2)}\n\n`;
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
