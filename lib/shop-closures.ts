import { timeToMins } from "@/lib/schedule";

export type ShopClosure = {
  time: string | null;
  endTime: string | null;
};

/**
 * A shop closure is a first-class availability constraint. A record without
 * a start time closes the entire local calendar day; a timed record closes
 * only its interval. This keeps closures out of customer appointments.
 */
export function shopClosureBlocksSlot(
  closure: ShopClosure,
  startMinutes: number,
  endMinutes: number,
): boolean {
  if (!closure.time) return true;

  const closureStart = timeToMins(closure.time);
  const closureEnd = closure.endTime ? timeToMins(closure.endTime) : closureStart + 15;
  if (!Number.isFinite(closureStart) || !Number.isFinite(closureEnd) || closureEnd <= closureStart) {
    return false;
  }

  return Math.max(startMinutes, closureStart) < Math.min(endMinutes, closureEnd);
}
