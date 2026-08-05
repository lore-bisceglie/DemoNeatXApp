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
import { validateTenantLogo } from "../lib/tenant-logo";
import { validateInstagramProfile } from "../lib/contact";
import {
  getMarketingRotationLength,
  selectDailyMarketingAsset,
} from "../lib/marketing-rotation";
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  hashAccountToken,
  shouldSendWelcomeAfterVerification,
  storedEmailVerificationToken,
} from "../lib/email-verification";
import { createTenantSessionToken, verifyTenantSessionToken } from "../lib/auth";
import { appointmentManagementSelect, canManageAppointment } from "../lib/appointment-management";
import { getDayScheduleForDate, type WeeklySchedule } from "../lib/schedule";
import {
  buildPaymentFailedEmail,
  buildSubscriptionActivatedEmail,
  buildSubscriptionCanceledEmail,
  buildTrialExpiredOfferEmail,
  buildTrialReminder1DayEmail,
  buildTrialReminder3DaysEmail,
  buildVerificationEmail,
  buildWelcomeEmail,
} from "../lib/email";

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

  const staffWeek: WeeklySchedule = {
    "venerdì": { active: true, blocks: [{ start: "07:00", end: "21:00" }] },
  };
  assert.deepEqual(
    getDayScheduleForDate(staffWeek, [{ date: "2026-08-14", type: "ferie", start: null, end: null }], "2026-08-14"),
    { active: false, blocks: [], exceptionNote: "Ferie" },
  );
  assert.deepEqual(
    getDayScheduleForDate(staffWeek, [{ date: "2026-08-14", type: "permesso", start: "14:00", end: "16:00" }], "2026-08-14"),
    { active: true, blocks: [{ start: "07:00", end: "14:00" }, { start: "16:00", end: "21:00" }], exceptionNote: "Permesso 14:00-16:00" },
  );
  assert.deepEqual(
    getDayScheduleForDate(staffWeek, [{ date: "2026-08-14", type: "pausa", start: "12:00", end: "13:00" }], "2026-08-14"),
    { active: true, blocks: [{ start: "07:00", end: "12:00" }, { start: "13:00", end: "21:00" }], exceptionNote: "Pausa 12:00-13:00" },
  );

  assert.deepEqual(validateTenantLogo("https://cdn.example.com/negozio.jpg"), {
    ok: true,
    value: "https://cdn.example.com/negozio.jpg",
  });
  assert.deepEqual(validateTenantLogo(""), { ok: true, value: null });
  assert.equal(validateTenantLogo("javascript:alert(1)").ok, false);
  assert.equal(validateTenantLogo("file:///C:/foto-negozio.jpg").ok, false);
  assert.equal(validateTenantLogo("data:image/svg+xml;base64,PHN2Zz4=").ok, false);
  assert.equal(validateTenantLogo("data:image/webp;base64,UklGRg==").ok, true);

  const rotationLength = getMarketingRotationLength();
  const rotatedImages = Array.from({ length: rotationLength }, (_, offset) =>
    selectDailyMarketingAsset(new Date(Date.UTC(2026, 6, 20, 12 + offset * 12))).image,
  );
  assert.equal(rotationLength, 20);
  assert.equal(new Set(rotatedImages).size, rotationLength);
  assert.notEqual(rotatedImages[0], rotatedImages[1]);
  assert.notEqual(
    selectDailyMarketingAsset(new Date(Date.UTC(2026, 6, 20, 8))).image,
    selectDailyMarketingAsset(new Date(Date.UTC(2026, 6, 20, 20))).image,
  );
  const tokenBaseTime = new Date("2026-07-22T10:00:00.000Z");
  const verificationToken = createEmailVerificationToken(tokenBaseTime);
  assert.equal(shouldSendWelcomeAfterVerification(verificationToken.rawToken), true);
  assert.equal(storedEmailVerificationToken(verificationToken.rawToken), verificationToken.storedToken);
  assert.equal(verificationToken.storedToken, hashAccountToken(verificationToken.rawToken));
  assert.equal(verificationToken.expiresAt.toISOString(), "2026-07-23T10:00:00.000Z");
  assert.equal(shouldSendWelcomeAfterVerification("v2-legacy-compatible"), true);
  assert.equal(shouldSendWelcomeAfterVerification("legacy-token"), false);
  assert.equal(storedEmailVerificationToken("legacy-token"), "legacy-token");
  const resetToken = createPasswordResetToken(tokenBaseTime);
  assert.equal(resetToken.storedToken, hashAccountToken(resetToken.rawToken));
  assert.equal(resetToken.expiresAt.toISOString(), "2026-07-22T10:30:00.000Z");
  const firstSession = createTenantSessionToken("negozio-test", 60, 0);
  assert.equal(verifyTenantSessionToken(firstSession, "negozio-test", 0), true);
  assert.equal(verifyTenantSessionToken(firstSession, "negozio-test", 1), false);
  const resetSession = createTenantSessionToken("negozio-test", 60, 1);
  assert.equal(verifyTenantSessionToken(resetSession, "negozio-test", 1), true);
  assert.equal(verifyTenantSessionToken(resetSession, "altro-negozio", 1), false);

  const verificationEmail = buildVerificationEmail("Lorenzo", "https://neatx.store/verify?token=test", true);
  assert.equal(verificationEmail.subject, "Conferma la tua email per attivare NeatX");
  assert.equal(verificationEmail.html.includes("50 messaggi bonus invito"), true);
  const welcomeEmail = buildWelcomeEmail("<script>alert(1)</script>", "https://negozio.neatx.store/?a=1&b=2");
  assert.equal(welcomeEmail.html.includes("<script>alert(1)</script>"), false);
  assert.equal(welcomeEmail.html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), true);
  assert.equal(buildTrialReminder3DaysEmail("Negozio", "Lorenzo", "https://neatx.store/admin").html.includes("590 € all'anno"), true);
  const lastDayEmail = buildTrialReminder1DayEmail("Negozio", "Lorenzo", "https://neatx.store/admin");
  assert.equal(lastDayEmail.html.includes("promemoria automatici"), false);
  assert.equal(lastDayEmail.html.includes("I dati non vengono cancellati"), true);
  assert.equal(buildTrialExpiredOfferEmail("Negozio", "Lorenzo", "https://neatx.store/paywall").html.includes("pronto per tornare online"), true);
  assert.equal(buildSubscriptionActivatedEmail("Negozio", "Lorenzo", "pro", "month", "https://neatx.store/admin").html.includes("temporaneamente disattivati"), true);
  assert.equal(buildPaymentFailedEmail("Negozio", "Lorenzo", "https://neatx.store/admin").html.includes("non è andato a buon fine"), true);
  assert.equal(buildSubscriptionCanceledEmail("Negozio", "Lorenzo", "https://neatx.store/paywall").html.includes("I dati non sono stati cancellati"), true);
  assert.equal(appointmentManagementSelect.serviceId, true);
  assert.equal(appointmentManagementSelect.staffId, true);
  const managedAppointment = { date: "2026-07-25", time: "10:30", endTime: "11:00", service: { duration: 30 } };
  assert.equal(canManageAppointment(managedAppointment, new Date("2026-07-25T08:59:00.000Z")), true);
  assert.equal(canManageAppointment(managedAppointment, new Date("2026-07-25T09:00:00.000Z")), false);
  assert.equal(canManageAppointment({ ...managedAppointment, date: "2026-07-26" }, new Date("2026-07-25T12:00:00.000Z")), true);
  assert.equal(canManageAppointment({ ...managedAppointment, date: "2026-07-24" }, new Date("2026-07-25T12:00:00.000Z")), false);
  assert.deepEqual(validateInstagramProfile(""), { valid: true, url: null });
  assert.deepEqual(validateInstagramProfile("@neatx_agenda"), { valid: true, url: "https://www.instagram.com/neatx_agenda/" });
  assert.deepEqual(validateInstagramProfile("https://www.instagram.com/neatx.agenda/?igsh=test"), { valid: true, url: "https://www.instagram.com/neatx.agenda/" });
  assert.equal(validateInstagramProfile("https://facebook.com/neatx_agenda").valid, false);
  assert.equal(validateInstagramProfile("https://www.instagram.com/reel/ABC123/").valid, false);
  assert.equal(validateInstagramProfile("nomeutente.").valid, false);
  assert.equal(validateInstagramProfile("nome..utente").valid, false);

  process.env.REMINDERS_ENABLED = "false";
  const disabled = await sendTenantMessage("does-not-exist", "+393330000000", "test");
  assert.equal(disabled.success, false);
  assert.equal("disabled" in disabled && disabled.disabled, true);

  console.log("release-unit-tests: 66 verifiche superate");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
