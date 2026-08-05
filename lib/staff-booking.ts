import { getRomeDayOfWeek } from "@/lib/rome-time";
import {
  dayIndexToName,
  getDayScheduleForDate,
  parseBaseSchedule,
  parseShiftExceptions,
  timeToMins,
  type ScheduleBlock,
  type WeeklySchedule,
} from "@/lib/schedule";

export type BookingStaffSchedule = {
  baseSchedule: string | null;
  shiftExceptions: string | null;
};

type StaffSlotInput = {
  staff: BookingStaffSchedule;
  date: string;
  startMinutes: number;
  endMinutes: number;
  fallbackBlocks: ScheduleBlock[];
};

/**
 * Final server-side guard for a staff booking.
 *
 * Staff without a native weekly schedule keep the legacy behaviour of
 * inheriting the store hours. Native shifts, holidays, permissions and pauses
 * always take precedence over those fallback hours.
 */
export function staffCanCoverBookingSlot({
  staff,
  date,
  startMinutes,
  endMinutes,
  fallbackBlocks,
}: StaffSlotInput): boolean {
  const baseSchedule = parseBaseSchedule(staff.baseSchedule);
  const exceptions = parseShiftExceptions(staff.shiftExceptions);
  const schedule: WeeklySchedule = Object.keys(baseSchedule).length > 0
    ? baseSchedule
    : {
        [dayIndexToName(getRomeDayOfWeek(new Date(`${date}T12:00:00Z`)))]: {
          active: fallbackBlocks.length > 0,
          blocks: fallbackBlocks,
        },
      };
  const daySchedule = getDayScheduleForDate(schedule, exceptions, date);

  return daySchedule.active && daySchedule.blocks.some((block) =>
    startMinutes >= timeToMins(block.start) && endMinutes <= timeToMins(block.end),
  );
}
