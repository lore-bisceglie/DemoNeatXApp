import assert from "node:assert/strict";
import { appointmentConflictsWithSlot } from "../lib/booking-conflict";
import { getDayScheduleSlotStatus, parseDaySchedule } from "../lib/opening-hours";
import {
  isSelfReferral,
  normalizeReferralCode,
  normalizeReferralIdentity,
  normalizeReferralPhone,
} from "../lib/referral-utils";
import { sendTenantMessage } from "../lib/sms";

async function run() {
  assert.equal(normalizeReferralCode(" neat-x_2026! "), "NEATX2026");
  assert.equal(normalizeReferralIdentity(" Test@Example.COM "), "test@example.com");
  assert.equal(normalizeReferralPhone("+39 333 123 4567"), "393331234567");
  assert.equal(normalizeReferralPhone("333 123 4567"), "393331234567");
  assert.equal(isSelfReferral(
    { email: "OWNER@example.com", phone: "3330000000" },
    { email: "owner@example.com", phone: "3999999999" },
  ), true);
  assert.equal(isSelfReferral(
    { email: "other@example.com", phone: "+39 333 000 0000" },
    { email: "owner@example.com", phone: "3330000000" },
  ), true);

  assert.equal(appointmentConflictsWithSlot(
    { time: "09:30", endTime: "10:30", customerName: "Cliente", staffId: "s1", locationId: "l1" },
    600,
    660,
    "s1",
    "l1",
  ), true);
  assert.equal(appointmentConflictsWithSlot(
    { time: "09:00", endTime: "10:00", customerName: "Cliente", staffId: "s1", locationId: "l1" },
    600,
    660,
    "s1",
    "l1",
  ), false);

  const mondaySchedule = parseDaySchedule(
    JSON.stringify({
      closed: [0],
      hours: {
        "1": { open: "09:00", close: "19:00", breakStart: "12:00", breakEnd: "13:00" },
        "6": { open: "09:00", close: "12:00", breakStart: null, breakEnd: null },
      },
    }),
    1,
    "09:00",
    "19:00",
  );
  const saturdaySchedule = parseDaySchedule(
    JSON.stringify({ closed: [0], hours: { "6": { open: "09:00", close: "12:00" } } }),
    6,
    "09:00",
    "19:00",
  );
  const sundaySchedule = parseDaySchedule(JSON.stringify({ closed: [0], hours: {} }), 0, "09:00", "19:00");

  assert.equal(getDayScheduleSlotStatus(mondaySchedule, "11:45"), "open");
  assert.equal(getDayScheduleSlotStatus(mondaySchedule, "12:00"), "break");
  assert.equal(getDayScheduleSlotStatus(mondaySchedule, "13:00"), "open");
  assert.equal(getDayScheduleSlotStatus(saturdaySchedule, "11:45"), "open");
  assert.equal(getDayScheduleSlotStatus(saturdaySchedule, "12:00"), "closed");
  assert.equal(getDayScheduleSlotStatus(saturdaySchedule, "11:45", 30), "closed");
  assert.equal(getDayScheduleSlotStatus(sundaySchedule, "10:00"), "closed");

  const disabled = await sendTenantMessage("does-not-exist", "+393330000000", "test");
  assert.equal(disabled.success, false);
  assert.equal("disabled" in disabled && disabled.disabled, true);

  console.log("release-unit-tests: 18 verifiche superate");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
