import { getRomeClock } from "@/lib/rome-time";

export const appointmentManagementSelect = {
  id: true,
  date: true,
  time: true,
  endTime: true,
  customerName: true,
  tenantId: true,
  locationId: true,
  serviceId: true,
  staffId: true,
  cancelToken: true,
  service: { select: { name: true, duration: true } },
} as const;

type ManageableAppointment = {
  date: string;
  time: string;
  endTime?: string | null;
  service?: { duration?: number | null } | null;
};

function timeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59 || (hours === 24 && minutes !== 0)) return null;
  return hours * 60 + minutes;
}

export function canManageAppointment(appointment: ManageableAppointment, now = new Date()): boolean {
  const romeNow = getRomeClock(now);
  if (appointment.date > romeNow.date) return true;
  if (appointment.date < romeNow.date) return false;

  const startMinutes = timeToMinutes(appointment.time);
  if (startMinutes === null) return false;
  const storedEndMinutes = appointment.endTime ? timeToMinutes(appointment.endTime) : null;
  const duration = Math.max(1, appointment.service?.duration || 15);
  const endMinutes = storedEndMinutes ?? startMinutes + duration;
  return romeNow.minutes < endMinutes;
}
