import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchStaffSchedule } from "@/lib/sheets";
import { parseBaseSchedule, parseShiftExceptions, getDayScheduleForDate, timeToMins, minsToTime } from "@/lib/schedule";

export type StaffDaySchedule = {
  isOff: boolean;
  shifts: { start: string; end: string }[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const tenantId = searchParams.get("tenantId");
  const locationId = searchParams.get("locationId");
  const serviceId = searchParams.get("serviceId");
  const requestedStaffId = searchParams.get("staffId");

  if (!date || !tenantId || !serviceId) {
    return NextResponse.json({ error: "Mancano parametri essenziali" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Data non valida" }, { status: 400 });
  }
  const requestedDate = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(requestedDate.getTime())) {
    return NextResponse.json({ error: "Data non valida" }, { status: 400 });
  }
  const maxBookingDate = new Date();
  maxBookingDate.setUTCDate(maxBookingDate.getUTCDate() + 60);
  const todayInRome = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (date < todayInRome) {
    return NextResponse.json({ error: "Data nel passato" }, { status: 400 });
  }
  if (requestedDate.getTime() > maxBookingDate.getTime() + 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "Data oltre il limite prenotabile" }, { status: 400 });
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId },
    select: { duration: true },
  });
  if (!service || service.duration < 5 || service.duration > 720) {
    return NextResponse.json({ error: "Servizio non valido" }, { status: 400 });
  }
  const duration = service.duration;

  // Se tenant ha 2+ sedi attive, locationId è obbligatorio
  const activeLocations = await prisma.location.findMany({
    where: { tenantId, isActive: true },
    select: { id: true },
    take: 2,
  });

  if (activeLocations.length > 1 && !locationId) {
    return NextResponse.json(
      { error: "Parametro locationId obbligatorio per tenant multi-sede" },
      { status: 400 }
    );
  }

  const effectiveLocationId = locationId || activeLocations[0]?.id || null;

  // Determina quale sede usare
  let location = null;
  if (effectiveLocationId) {
    location = await prisma.location.findFirst({
      where: { id: effectiveLocationId, tenantId },
      select: {
        id: true,
        openTime: true,
        closeTime: true,
        breakStart: true,
        breakEnd: true,
        closedDays: true,
        staffSheetUrl: true,
        isActive: true,
      },
    });
    if (!location || !location.isActive) {
      return NextResponse.json({ error: "Sede non trovata o inattiva" }, { status: 404 });
    }
  } else {
    // Single location fallback: usa orari tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { openTime: true, closeTime: true, breakStart: true, breakEnd: true, closedDays: true, staffSheetUrl: true },
    });
    if (!tenant) return NextResponse.json({ error: "Tenant non trovato" }, { status: 404 });
    location = { ...tenant, isActive: true } as any;
  }

  const openTime = location.openTime ? timeToMins(location.openTime) : 9 * 60;
  const closeTime = location.closeTime ? timeToMins(location.closeTime) : 19 * 60;

  // Check chiusura settimanale
  if (location.closedDays) {
    try {
      const closedDaysArray = JSON.parse(location.closedDays);
      const dateObj = new Date(date + 'T12:00:00');
      const dayOfWeek = dateObj.getDay();
      if (closedDaysArray.includes(dayOfWeek)) {
        return NextResponse.json({ slots: [], isHoliday: false, isClosedDay: true });
      }
    } catch (e) {}
  }

  try {
    // Controlliamo TUTTI gli appuntamenti del tenant, senza filtrare per locationId.
    // In questo modo, se un dipendente (es. Antonio) lavora in 2 sedi,
    // un appuntamento a Milano bloccherà correttamente il suo slot anche se un cliente cerca a Roma.
    const appointmentWhere: any = { date: date, tenantId: tenantId };

    const appointments = await prisma.appointment.findMany({
      where: appointmentWhere,
      select: {
        time: true,
        endTime: true,
        customerName: true,
        staffId: true,
        locationId: true,
      },
    });

    const holidayAppointments = appointments.filter(
      (app) => app.time === "ALL_DAY" || app.customerName.includes("FERIE")
    );
    const isGlobalHoliday = holidayAppointments.some(
      (app) =>
        !app.staffId &&
        (app.locationId === null || app.locationId === effectiveLocationId),
    );
    if (isGlobalHoliday) {
      return NextResponse.json({ slots: [], isHoliday: true });
    }
    const staffOnHoliday = new Set(
      holidayAppointments.flatMap((app) => (app.staffId ? [app.staffId] : []))
    );

    // Intervalli occupati per staff
    const bookedIntervalsByStaff: Record<string, { start: number; end: number }[]> = {};
    appointments
      .filter((app) => app.time !== "ALL_DAY" && !app.customerName.includes("FERIE"))
      .forEach((app) => {
      const start = timeToMins(app.time);
      const end = app.endTime ? timeToMins(app.endTime) : start + 15;
      if (!app.staffId && app.locationId !== effectiveLocationId) return;
      const sId = app.staffId || 'unassigned';
      if (!bookedIntervalsByStaff[sId]) bookedIntervalsByStaff[sId] = [];
      bookedIntervalsByStaff[sId].push({ start, end });
    });

    // Staff capaci del servizio E che lavora in questa sede
    let capableStaffIds: string[] = [];
    let allStaff: { id: string; name: string; baseSchedule: string | null; shiftExceptions: string | null }[] = [];

    if (serviceId) {
      const serviceWithStaff = await prisma.service.findFirst({
        where: { id: serviceId, tenantId },
        include: {
          staff: {
            select: { id: true, name: true, baseSchedule: true, shiftExceptions: true, locationId: true, locations: { select: { locationId: true } } },
          },
        },
      });
      if (serviceWithStaff && serviceWithStaff.staff.length > 0) {
        // Filtra staff per locationId (StaffLocation + backward compat)
        const filteredStaff = serviceWithStaff.staff.filter((s) => {
          if (requestedStaffId && s.id !== requestedStaffId) return false;
          const hasExplicitLocation = s.locations && s.locations.length > 0;
          if (hasExplicitLocation) return s.locations.some((l: any) => l.locationId === effectiveLocationId);
          return !s.locationId || s.locationId === effectiveLocationId;
        });
        if (filteredStaff.length > 0) {
          capableStaffIds = filteredStaff.map((s) => s.id);
          allStaff = filteredStaff;
        }
      }
    }

    if (requestedStaffId && capableStaffIds.length === 0) {
      return NextResponse.json(
        { error: "Operatore non disponibile per questo servizio o questa sede" },
        { status: 400 },
      );
    }

    if (capableStaffIds.length === 0) {
      // Fallback: tutto lo staff del tenant che lavora in questa sede
      const allStaffWhere: any = { tenantId };
      if (requestedStaffId) allStaffWhere.id = requestedStaffId;
      if (effectiveLocationId) {
        allStaffWhere.OR = [
          { locations: { some: { locationId: effectiveLocationId } } },
          { AND: [{ locations: { none: {} } }, { locationId: null }] },
          { AND: [{ locations: { none: {} } }, { locationId: effectiveLocationId }] },
        ];
      }
      const allStaffResult = await prisma.staff.findMany({
        where: allStaffWhere,
        select: { id: true, name: true, baseSchedule: true, shiftExceptions: true },
      });
      if (allStaffResult.length > 0) {
        capableStaffIds = allStaffResult.map((s) => s.id);
        allStaff = allStaffResult;
      } else {
        capableStaffIds = ['unassigned'];
      }
    }

    // Costruisci schedule per ogni staff: DB prima, poi Google Sheet fallback
    const staffSchedules: Record<string, StaffDaySchedule> = {};

    for (const staff of allStaff) {
      const baseSchedule = parseBaseSchedule(staff.baseSchedule);
      const exceptions = parseShiftExceptions(staff.shiftExceptions);
      const exception = exceptions.find(e => e.date === date);

      if (Object.keys(baseSchedule).length > 0) {
        // Usa DB
        const dayResult = getDayScheduleForDate(baseSchedule, exceptions, date);
        if (!dayResult.active) {
          staffSchedules[staff.id] = { isOff: true, shifts: [] };
        } else {
          staffSchedules[staff.id] = { isOff: false, shifts: dayResult.blocks };
        }
      } else if (location.staffSheetUrl) {
        // Fallback Google Sheet
        const sheetSchedule = await fetchStaffSchedule(location.staffSheetUrl, staff.name, date);
        if (sheetSchedule) {
          staffSchedules[staff.id] = sheetSchedule;
        }
      } else {
        // Nessun base schedule e nessun Google Sheet: fallback a orari sede
        // Ma se c'è un'eccezione di ferie, il dipendente è offline
        if (exception && exception.type === "ferie") {
          staffSchedules[staff.id] = { isOff: true, shifts: [] };
        }
      }
    }

    // Pausa pranzo sede
    const breakStartMins = location.breakStart ? timeToMins(location.breakStart) : null;
    const breakEndMins = location.breakEnd ? timeToMins(location.breakEnd) : null;

    // Motore di collisione
    let availableSlots: string[] = [];

    for (let currentSlotMins = openTime; currentSlotMins <= closeTime - duration; currentSlotMins += 15) {
      const potentialStart = currentSlotMins;
      const potentialEnd = potentialStart + duration;

      let availableStaffCount = 0;

      for (const sId of capableStaffIds) {
        if (staffOnHoliday.has(sId)) continue;
        if (staffSchedules[sId]) {
          const schedule = staffSchedules[sId];
          if (schedule.isOff) continue;

          let withinShift = false;
          for (const shift of schedule.shifts) {
            const shiftStart = timeToMins(shift.start);
            const shiftEnd = timeToMins(shift.end);
            if (potentialStart >= shiftStart && potentialEnd <= shiftEnd) {
              withinShift = true;
              break;
            }
          }
          if (!withinShift) continue;
        } else {
          // Fallback orari sede
          if (breakStartMins !== null && breakEndMins !== null) {
            if (Math.max(potentialStart, breakStartMins) < Math.min(potentialEnd, breakEndMins)) {
              continue;
            }
          }
        }

        const staffIntervals = bookedIntervalsByStaff[sId] || [];
        let staffHasOverlap = false;
        for (const interval of staffIntervals) {
          if (Math.max(potentialStart, interval.start) < Math.min(potentialEnd, interval.end)) {
            staffHasOverlap = true;
            break;
          }
        }

        if (!staffHasOverlap) availableStaffCount++;
      }

      const unassignedIntervals = bookedIntervalsByStaff['unassigned'] || [];
      let overlappingUnassignedCount = 0;
      for (const interval of unassignedIntervals) {
        if (Math.max(potentialStart, interval.start) < Math.min(potentialEnd, interval.end)) {
          overlappingUnassignedCount++;
        }
      }

      if (availableStaffCount > overlappingUnassignedCount) {
        availableSlots.push(minsToTime(potentialStart));
      }
    }

    // Filtro passato
    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = dateFormatter.formatToParts(now);
    const todayItaly = `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}-${parts.find((p) => p.type === 'day')?.value}`;

    if (date === todayItaly) {
      const timeFormatter = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false });
      const currentTimeItaly = timeFormatter.format(now);
      const [currentHours, currentMinutes] = currentTimeItaly.split(':').map(Number);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      availableSlots = availableSlots.filter((slot) => timeToMins(slot) > currentTotalMinutes);
    }

    return NextResponse.json({
      slots: availableSlots,
      isHoliday: false,
      locationId: effectiveLocationId,
    });

  } catch (error) {
    console.error("Errore Availability:", error);
    return NextResponse.json({ error: "Errore di connessione" }, { status: 500 });
  }
}
