import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchStaffSchedule, StaffDaySchedule } from "@/lib/sheets";

// Funzioni Helper per matematica oraria
const timeToMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minsToTime = (m: number) => {
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const min = (m % 60).toString().padStart(2, '0');
  return `${h}:${min}`;
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

  // Recupera orari personalizzati del tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { openTime: true, closeTime: true, breakStart: true, breakEnd: true, closedDays: true, staffSheetUrl: true }
  });

  const openTime = tenant?.openTime ? timeToMins(tenant.openTime) : 9 * 60;
  const closeTime = tenant?.closeTime ? timeToMins(tenant.closeTime) : 19 * 60;
  const interval = 15;

  // Controlla se il giorno è un giorno di chiusura settimanale
  if (tenant?.closedDays) {
    try {
      const closedDaysArray = JSON.parse(tenant.closedDays);
      const dateObj = new Date(date + 'T12:00:00');
      const dayOfWeek = dateObj.getDay();
      if (closedDaysArray.includes(dayOfWeek)) {
        return NextResponse.json({ slots: [], isHoliday: false, isClosedDay: true });
      }
    } catch (e) {
      // Ignora JSON malformato
    }
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

    // Costruiamo gli intervalli già occupati per STAFF [Inizio, Fine]
    const bookedIntervalsByStaff: Record<string, { start: number, end: number }[]> = {};

    appointments.forEach(app => {
      const start = timeToMins(app.time);
      const end = app.endTime ? timeToMins(app.endTime) : start + 15; 
      
      const sId = app.staffId || 'unassigned';
      if (!bookedIntervalsByStaff[sId]) {
        bookedIntervalsByStaff[sId] = [];
      }
      bookedIntervalsByStaff[sId].push({ start, end });
    });

    // Recuperiamo lo Staff capace di eseguire il servizio (o tutti se nessun serviceId)
    let capableStaffIds: string[] = [];
    
    if (serviceId) {
      const serviceWithStaff = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { staff: true }
      });
      if (serviceWithStaff && serviceWithStaff.staff.length > 0) {
        capableStaffIds = serviceWithStaff.staff.map(s => s.id);
        allStaffForNames = serviceWithStaff.staff;
      }
    }
    
    // Fallback: se non abbiamo staff specifico, permettiamo a tutti (simulazione vecchi tenant)
    if (capableStaffIds.length === 0) {
      const allStaff = await prisma.staff.findMany({ where: { tenantId } });
      if (allStaff.length > 0) {
        capableStaffIds = allStaff.map(s => s.id);
        allStaffForNames = allStaff;
      } else {
        // Fallback totale per i tenant senza staff (retrocompatibilità)
        capableStaffIds = ['unassigned'];
      }
    }

    // Google Sheets Integration
    const staffSchedules: Record<string, StaffDaySchedule> = {};
    if (tenant?.staffSheetUrl && allStaffForNames.length > 0) {
      for (const staff of allStaffForNames) {
        const schedule = await fetchStaffSchedule(tenant.staffSheetUrl, staff.name, date);
        if (schedule) {
          staffSchedules[staff.id] = schedule;
        }
      }
    }

    // Calcola intervallo pausa pranzo
    const breakStartMins = tenant?.breakStart ? timeToMins(tenant.breakStart) : null;
    const breakEndMins = tenant?.breakEnd ? timeToMins(tenant.breakEnd) : null;

    // 🌟 MOTORE DI COLLISIONE PER STAFF
    let availableSlots: string[] = [];
    
    for (let currentSlotMins = openTime; currentSlotMins <= closeTime - duration; currentSlotMins += interval) {
      const potentialStart = currentSlotMins;
      const potentialEnd = potentialStart + duration;

      let isSlotAvailable = false;

      // Se c'è almeno un membro dello staff in grado di farlo libero, lo slot è disponibile
      for (const sId of capableStaffIds) {
        // --- GOOGLE SHEETS SCHEDULING ---
        if (staffSchedules[sId]) {
          const schedule = staffSchedules[sId];
          if (schedule.isOff) continue; // Oggi non lavora

          let withinShift = false;
          for (const shift of schedule.shifts) {
            const shiftStart = timeToMins(shift.start);
            const shiftEnd = timeToMins(shift.end);
            if (potentialStart >= shiftStart && potentialEnd <= shiftEnd) {
              withinShift = true;
              break;
            }
          }
          if (!withinShift) continue; // Fuori turno

        } else {
          // --- STANDARD TENANT HOURS FALLBACK ---
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
        
        if (!staffHasOverlap) {
          isSlotAvailable = true;
          break; // Trovato un parrucchiere libero, lo slot è valido
        }
      }

      if (isSlotAvailable) {
        availableSlots.push(minsToTime(potentialStart));
      }
    }

    // Filtro Passato
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
        const slotMins = timeToMins(slot);
        return slotMins > currentTotalMinutes;
      });
    }

    return NextResponse.json({ slots: availableSlots, isHoliday: false });
    
  } catch (error) {
    console.error("Errore Availability:", error);
    return NextResponse.json({ error: "Errore di connessione" }, { status: 500 });
  }
}
