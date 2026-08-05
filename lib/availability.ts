import "server-only";

import { prisma } from "@/lib/prisma";
import {
  parseBaseSchedule,
  parseShiftExceptions,
  getDayScheduleForDate,
  dayIndexToName,
  timeToMins,
  minsToTime,
} from "@/lib/schedule";
import { parseDaySchedule } from "@/lib/opening-hours";
import { shopClosureBlocksSlot } from "@/lib/shop-closures";

export type StaffDaySchedule = {
  isOff: boolean;
  shifts: { start: string; end: string }[];
};

export type AvailabilityInput = {
  date: string;
  tenantId: string;
  serviceId: string;
  locationId?: string | null;
  staffId?: string | null;
};

export type AvailabilityResult = {
  slots: string[];
  isHoliday: boolean;
  isClosedDay?: boolean;
  isShopClosed?: boolean;
  locationId: string | null;
};

export type FirstAvailabilityResult = {
  found: boolean;
  date?: string;
  time?: string;
  locationId?: string | null;
};

export class AvailabilityError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AvailabilityError";
    this.status = status;
  }
}

function getTodayInRome(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addCalendarDays(date: string, days: number): string {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export async function getAvailabilityForDate({
  date,
  tenantId,
  locationId,
  serviceId,
  staffId,
}: AvailabilityInput): Promise<AvailabilityResult> {
  const requestedStaffId = staffId && staffId !== "any" ? staffId : null;

  if (!date || !tenantId || !serviceId) {
    throw new AvailabilityError("Mancano parametri essenziali", 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AvailabilityError("Data non valida", 400);
  }

  const requestedDate = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(requestedDate.getTime())) {
    throw new AvailabilityError("Data non valida", 400);
  }

  const maxBookingDate = new Date();
  maxBookingDate.setUTCDate(maxBookingDate.getUTCDate() + 60);
  const todayInRome = getTodayInRome();

  if (date < todayInRome) {
    throw new AvailabilityError("Data nel passato", 400);
  }

  if (requestedDate.getTime() > maxBookingDate.getTime() + 24 * 60 * 60 * 1000) {
    throw new AvailabilityError("Data oltre il limite prenotabile", 400);
  }

  // These reads are independent. Running them together removes two database
  // round trips from the hot availability path without changing its rules.
  const [tenant, appointments, serviceWithStaff, shopClosures] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        openTime: true,
        closeTime: true,
        breakStart: true,
        breakEnd: true,
        closedDays: true,
        locations: {
          where: { isActive: true },
          select: {
            id: true,
            openTime: true,
            closeTime: true,
            breakStart: true,
            breakEnd: true,
            closedDays: true,
          },
        },
      },
    }),
    prisma.appointment.findMany({
      where: { date, tenantId },
      select: {
        time: true,
        endTime: true,
        customerName: true,
        staffId: true,
        locationId: true,
      },
    }),
    prisma.service.findFirst({
      where: { id: serviceId, tenantId },
      select: {
        duration: true,
        staff: {
          select: {
            id: true,
            name: true,
            baseSchedule: true,
            shiftExceptions: true,
            locationId: true,
            locations: { select: { locationId: true } },
          },
        },
      },
    }),
    prisma.blockedSlot.findMany({
      where: { tenantId, date },
      select: { time: true, endTime: true },
    }),
  ]);

  if (!tenant) throw new AvailabilityError("Tenant non trovato", 404);
  const activeLocations = tenant.locations;

  if (activeLocations.length > 1 && !locationId) {
    throw new AvailabilityError("Parametro locationId obbligatorio per tenant multi-sede", 400);
  }

  const effectiveLocationId = locationId || activeLocations[0]?.id || null;

  let location: Pick<
    NonNullable<typeof tenant>,
    "openTime" | "closeTime" | "breakStart" | "breakEnd" | "closedDays"
  > = tenant;
  if (effectiveLocationId) {
    const selectedLocation = activeLocations.find((item) => item.id === effectiveLocationId);
    if (!selectedLocation) {
      throw new AvailabilityError("Sede non trovata o inattiva", 404);
    }
    location = selectedLocation;
  }

  const dayOfWeek = requestedDate.getUTCDay();
  const daySchedule = parseDaySchedule(
    location.closedDays,
    dayOfWeek,
    location.openTime,
    location.closeTime,
    location.breakStart,
    location.breakEnd,
  );

  if (daySchedule.isClosed) {
    return {
      slots: [],
      isHoliday: false,
      isClosedDay: true,
      locationId: effectiveLocationId,
    };
  }

  const openTime = timeToMins(daySchedule.open);
  const closeTime = timeToMins(daySchedule.close);

  const holidayAppointments = appointments.filter(
    (appointment) =>
      appointment.time === "ALL_DAY" || appointment.customerName.includes("FERIE"),
  );
  const isGlobalHoliday = holidayAppointments.some(
    (appointment) =>
      !appointment.staffId &&
      (appointment.locationId === null || appointment.locationId === effectiveLocationId),
  );
  if (isGlobalHoliday) {
    return { slots: [], isHoliday: true, locationId: effectiveLocationId };
  }

  const staffOnHoliday = new Set(
    holidayAppointments.flatMap((appointment) => {
      if (!appointment.staffId) return [];
      if (appointment.locationId !== null && appointment.locationId !== effectiveLocationId) {
        return [];
      }
      return [appointment.staffId];
    }),
  );

  const bookedIntervalsByStaff: Record<string, { start: number; end: number }[]> = {};
  appointments
    .filter(
      (appointment) =>
        appointment.time !== "ALL_DAY" && !appointment.customerName.includes("FERIE"),
    )
    .forEach((appointment) => {
      const start = timeToMins(appointment.time);
      const end = appointment.endTime ? timeToMins(appointment.endTime) : start + 15;
      if (!appointment.staffId && appointment.locationId !== effectiveLocationId) return;
      const staffKey = appointment.staffId || "unassigned";
      if (!bookedIntervalsByStaff[staffKey]) bookedIntervalsByStaff[staffKey] = [];
      bookedIntervalsByStaff[staffKey].push({ start, end });
    });

  let capableStaffIds: string[] = [];
  let allStaff: {
    id: string;
    name: string;
    baseSchedule: string | null;
    shiftExceptions: string | null;
  }[] = [];

  if (!serviceWithStaff || serviceWithStaff.duration < 5 || serviceWithStaff.duration > 720) {
    throw new AvailabilityError("Servizio non valido", 400);
  }

  if (shopClosures.some((closure) => closure.time === null)) {
    return {
      slots: [],
      isHoliday: false,
      isShopClosed: true,
      locationId: effectiveLocationId,
    };
  }
  const duration = serviceWithStaff.duration;

  if (serviceWithStaff && serviceWithStaff.staff.length > 0) {
    const filteredStaff = serviceWithStaff.staff.filter((staff) => {
      if (requestedStaffId && staff.id !== requestedStaffId) return false;
      const hasExplicitLocation = staff.locations && staff.locations.length > 0;
      if (hasExplicitLocation) {
        return staff.locations.some((item) => item.locationId === effectiveLocationId);
      }
      return !staff.locationId || staff.locationId === effectiveLocationId;
    });

    if (filteredStaff.length > 0) {
      capableStaffIds = filteredStaff.map((staff) => staff.id);
      allStaff = filteredStaff;
    }
  }

  if (requestedStaffId && capableStaffIds.length === 0) {
    throw new AvailabilityError("Operatore non disponibile per questo servizio o questa sede", 400);
  }

  if (capableStaffIds.length === 0) {
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
      capableStaffIds = allStaffResult.map((staff) => staff.id);
      allStaff = allStaffResult;
    } else {
      capableStaffIds = ["unassigned"];
    }
  }

  const staffSchedules: Record<string, StaffDaySchedule> = {};
  const staffOnNativeHoliday = new Set<string>();
  for (const staff of allStaff) {
    const baseSchedule = parseBaseSchedule(staff.baseSchedule);
    const exceptions = parseShiftExceptions(staff.shiftExceptions);
    if (exceptions.some((item) => item.date === date && item.type === "ferie")) {
      staffOnNativeHoliday.add(staff.id);
    }
    if (Object.keys(baseSchedule).length > 0) {
      const dayResult = getDayScheduleForDate(baseSchedule, exceptions, date);
      staffSchedules[staff.id] = dayResult.active
        ? { isOff: false, shifts: dayResult.blocks }
        : { isOff: true, shifts: [] };
    } else if (exceptions.some((item) => item.date === date)) {
      // Compatibilità per collaboratori creati prima degli orari nativi:
      // usa l'orario della sede come base e applica comunque l'eccezione.
      const fallbackDay = dayIndexToName(requestedDate.getUTCDay());
      const fallbackSchedule = {
        [fallbackDay]: { active: true, blocks: [{ start: daySchedule.open, end: daySchedule.close }] },
      };
      const dayResult = getDayScheduleForDate(fallbackSchedule, exceptions, date);
      staffSchedules[staff.id] = dayResult.active
        ? { isOff: false, shifts: dayResult.blocks }
        : { isOff: true, shifts: [] };
    }
  }

  const breakStartMins = daySchedule.breakStart ? timeToMins(daySchedule.breakStart) : null;
  const breakEndMins = daySchedule.breakEnd ? timeToMins(daySchedule.breakEnd) : null;
  const availableSlots: string[] = [];

  for (
    let currentSlotMins = openTime;
    currentSlotMins <= closeTime - duration;
    currentSlotMins += 15
  ) {
    const potentialStart = currentSlotMins;
    const potentialEnd = potentialStart + duration;
    if (shopClosures.some((closure) => shopClosureBlocksSlot(closure, potentialStart, potentialEnd))) {
      continue;
    }
    let availableStaffCount = 0;

    for (const staffId of capableStaffIds) {
      if (staffOnHoliday.has(staffId) || staffOnNativeHoliday.has(staffId)) continue;

      if (staffSchedules[staffId]) {
        const schedule = staffSchedules[staffId];
        if (schedule.isOff) continue;

        const withinShift = schedule.shifts.some((shift) => {
          const shiftStart = timeToMins(shift.start);
          const shiftEnd = timeToMins(shift.end);
          return potentialStart >= shiftStart && potentialEnd <= shiftEnd;
        });
        if (!withinShift) continue;
      }

      // The shop break is an absolute constraint. It must apply whether the
      // staff member inherits store hours or has a custom weekly schedule.
      if (breakStartMins !== null && breakEndMins !== null) {
        if (Math.max(potentialStart, breakStartMins) < Math.min(potentialEnd, breakEndMins)) {
          continue;
        }
      }

      const staffIntervals = bookedIntervalsByStaff[staffId] || [];
      const staffHasOverlap = staffIntervals.some(
        (interval) => Math.max(potentialStart, interval.start) < Math.min(potentialEnd, interval.end),
      );
      if (!staffHasOverlap) availableStaffCount++;
    }

    const unassignedIntervals = bookedIntervalsByStaff.unassigned || [];
    const overlappingUnassignedCount = unassignedIntervals.filter(
      (interval) => Math.max(potentialStart, interval.start) < Math.min(potentialEnd, interval.end),
    ).length;

    if (availableStaffCount > overlappingUnassignedCount) {
      availableSlots.push(minsToTime(potentialStart));
    }
  }

  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dateFormatter.formatToParts(now);
  const todayItaly = `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;

  if (date === todayItaly) {
    const timeFormatter = new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const [currentHours, currentMinutes] = timeFormatter
      .format(now)
      .split(":")
      .map(Number);
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    availableSlots.splice(
      0,
      availableSlots.length,
      ...availableSlots.filter((slot) => timeToMins(slot) > currentTotalMinutes),
    );
  }

  const isHoliday = capableStaffIds.length > 0 && capableStaffIds.every(
    (id) => staffOnHoliday.has(id) || staffOnNativeHoliday.has(id),
  );

  return {
    slots: availableSlots,
    isHoliday,
    locationId: effectiveLocationId,
  };
}

export async function findFirstAvailability({
  tenantId,
  serviceId,
  locationId,
  staffId,
}: Omit<AvailabilityInput, "date">): Promise<FirstAvailabilityResult> {
  const today = getTodayInRome();

  for (let offset = 0; offset <= 60; offset += 1) {
    const date = addCalendarDays(today, offset);
    const availability = await getAvailabilityForDate({
      date,
      tenantId,
      serviceId,
      locationId,
      staffId,
    });

    if (availability.slots.length > 0) {
      return {
        found: true,
        date,
        time: availability.slots[0],
        locationId: availability.locationId,
      };
    }
  }

  return { found: false };
}
