import assert from "node:assert/strict";
import { appointmentConflictsWithSlot } from "../lib/booking-conflict";
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

  const disabled = await sendTenantMessage("does-not-exist", "+393330000000", "test");
  assert.equal(disabled.success, false);
  assert.equal("disabled" in disabled && disabled.disabled, true);

  console.log("release-unit-tests: 11 verifiche superate");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
