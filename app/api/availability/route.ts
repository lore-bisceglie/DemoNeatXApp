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
  const duration = parseInt(searchParams.get("duration") || "30", 10);
  const serviceId = searchParams.get("serviceId");

  if (!date || !tenantId) {
    return NextResponse.json({ error: "Mancano parametri essenziali" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { openTime: true, closeTime: true, breakStart: true, breakEnd: true, closedDays: true, staffSheetUrl: true }
  });

  const openTime = tenant?.openTime ? timeToMins(tenant.openTime) : 9 * 60;
  const closeTime = tenant?.closeTime ? timeToMins(tenant.closeTime) : 19 * 60;
  const interval = 15;

  // Check chiusura settimanale
  if (tenant?.closedDays) {
    try {
      const closedDaysArray = JSON.parse(tenant.closedDays);
      const dateObj = new Date(date + 'T12:00:00');
      const dayOfWeek = dateObj.getDay();
      if (closedDaysArray.includes(dayOfWeek)) {
        return NextResponse.json({ slots: [], isHoliday: false, isClosedDay: true });
      }
    } catch (e) {}
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: { date: date, tenantId: tenantId },
      select: { time: true, endTime: true, customerName: true, staffId: true }
    });

    const isHoliday = appointments.some((app) => app.time === "ALL_DAY" || app.customerName.includes("FERIE"));
    if (isHoliday) {
      return NextResponse.json({ slots: [], isHoliday: true });
    }

    // Intervalli occupati per staff
    const bookedIntervalsByStaff: Record<string, { start: number, end: number }[]> = {};
    appointments.forEach(app => {
      const start = timeToMins(app.time);
      const end = app.endTime ? timeToMins(app.endTime) : start + 15;
      const sId = app.staffId || 'unassigned';
      if (!bookedIntervalsByStaff[sId]) bookedIntervalsByStaff[sId] = [];
      bookedIntervalsByStaff[sId].push({ start, end });
    });

    // Staff capaci del servizio
    let capableStaffIds: string[] = [];
    let allStaff: { id: string; name: string; baseSchedule: string | null; shiftExceptions: string | null }[] = [];

    if (serviceId) {
      const serviceWithStaff = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { staff: { select: { id: true, name: true, baseSchedule: true, shiftExceptions: true } } }
      });
      if (serviceWithStaff && serviceWithStaff.staff.length > 0) {
        capableStaffIds = serviceWithStaff.staff.map(s => s.id);
        allStaff = serviceWithStaff.staff;
      }
    }

    if (capableStaffIds.length === 0) {
      const allStaffResult = await prisma.staff.findMany({
        where: { tenantId },
        select: { id: true, name: true, baseSchedule: true, shiftExceptions: true }
      });
      if (allStaffResult.length > 0) {
        capableStaffIds = allStaffResult.map(s => s.id);
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

      if (Object.keys(baseSchedule).length > 0) {
        // Usa DB
        const dayResult = getDayScheduleForDate(baseSchedule, exceptions, date);
        if (!dayResult.active) {
          staffSchedules[staff.id] = { isOff: true, shifts: [] };
        } else {
          staffSchedules[staff.id] = { isOff: false, shifts: dayResult.blocks };
        }
      } else if (tenant?.staffSheetUrl) {
        // Fallback Google Sheet
        const sheetSchedule = await fetchStaffSchedule(tenant.staffSheetUrl, staff.name, date);
        if (sheetSchedule) {
          staffSchedules[staff.id] = sheetSchedule;
        }
      }
    }

    // Pausa pranzo tenant
    const breakStartMins = tenant?.breakStart ? timeToMins(tenant.breakStart) : null;
    const breakEndMins = tenant?.breakEnd ? timeToMins(tenant.breakEnd) : null;

    // Motore di collisione
    let availableSlots: string[] = [];

    for (let currentSlotMins = openTime; currentSlotMins <= closeTime - duration; currentSlotMins += interval) {
      const potentialStart = currentSlotMins;
      const potentialEnd = potentialStart + duration;

      let availableStaffCount = 0;

      for (const sId of capableStaffIds) {
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
          // Fallback orari tenant
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
    const todayItaly = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;

    if (date === todayItaly) {
      const timeFormatter = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false });
      const currentTimeItaly = timeFormatter.format(now);
      const [currentHours, currentMinutes] = currentTimeItaly.split(':').map(Number);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      availableSlots = availableSlots.filter(slot => {
        return timeToMins(slot) > currentTotalMinutes;
      });
    }

    return NextResponse.json({ slots: availableSlots, isHoliday: false });

  } catch (error) {
    console.error("Errore Availability:", error);
    return NextResponse.json({ error: "Errore di connessione" }, { status: 500 });
  }
}
