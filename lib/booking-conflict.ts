export type BusyAppointment = {
  time: string;
  endTime: string | null;
  customerName: string;
  staffId: string | null;
  locationId: string | null;
};

export const bookingTimeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export function appointmentConflictsWithSlot(
  appointment: BusyAppointment,
  startMinutes: number,
  endMinutes: number,
  staffId: string | null | undefined,
  locationId: string | null,
) {
  const sameLocation = (appointment.locationId ?? null) === locationId;
  const isHoliday =
    appointment.time === "ALL_DAY" || appointment.customerName.includes("FERIE");

  if (isHoliday) {
    if (appointment.staffId) return Boolean(staffId && appointment.staffId === staffId);
    return appointment.locationId === null || sameLocation;
  }

  if (staffId && appointment.staffId) {
    if (appointment.staffId !== staffId) return false;
  } else if (!sameLocation) {
    return false;
  }

  const appointmentStart = bookingTimeToMinutes(appointment.time);
  const appointmentEnd = appointment.endTime
    ? bookingTimeToMinutes(appointment.endTime)
    : appointmentStart + 15;

  return Math.max(startMinutes, appointmentStart) < Math.min(endMinutes, appointmentEnd);
}
