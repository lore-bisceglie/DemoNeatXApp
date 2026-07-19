import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";

async function verifyOnce(token: string, slug: string) {
  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findFirst({
      where: { slug, emailVerifyToken: token, emailVerified: false },
      select: { id: true },
    });
    if (!tenant) return 0;
    const changed = await tx.tenant.updateMany({
      where: { id: tenant.id, emailVerifyToken: token, emailVerified: false, referralSignupBonusAt: null },
      data: { emailVerified: true, emailVerifyToken: null, referralSignupBonusAt: new Date() },
    });
    if (changed.count !== 1) return 0;
    await tx.storeSettings.update({ where: { tenantId: tenant.id }, data: { smsCredits: { increment: 50 } } });
    return 50;
  }, { isolationLevel: "Serializable" });
}

async function rewardOnce(referredTenantId: string) {
  return prisma.$transaction(async (tx) => {
    const referred = await tx.tenant.findUniqueOrThrow({
      where: { id: referredTenantId },
      select: { referredByCode: true },
    });
    const referrer = await tx.tenant.findUniqueOrThrow({
      where: { referralCode: referred.referredByCode! },
      select: { id: true },
    });
    const changed = await tx.tenant.updateMany({
      where: { id: referredTenantId, referralRewardedAt: null },
      data: { referralRewardedAt: new Date() },
    });
    if (changed.count !== 1) return false;
    await tx.storeSettings.update({ where: { tenantId: referrer.id }, data: { smsCredits: { increment: 100 } } });
    return true;
  }, { isolationLevel: "Serializable" });
}

const runId = randomUUID().slice(0, 8);
const referrerId = `qa-release-referrer-${runId}`;
const inviteeId = `qa-release-invitee-${runId}`;
const refCode = `QARELEASE${runId.toUpperCase()}`;
const verifyToken = randomUUID();

async function run() {
try {
  await prisma.tenant.create({
    data: {
      id: referrerId,
      slug: referrerId,
      name: "QA Release Referrer",
      ownerEmail: `${referrerId}@example.invalid`,
      emailVerified: true,
      isDemoData: true,
      referralCode: refCode,
      storeSettings: { create: { smsCredits: 50 } },
    },
  });
  await prisma.tenant.create({
    data: {
      id: inviteeId,
      slug: inviteeId,
      name: "QA Release Invitee",
      ownerEmail: `${inviteeId}@example.invalid`,
      emailVerified: false,
      emailVerifyToken: verifyToken,
      isDemoData: true,
      referredByCode: refCode,
      referredAt: new Date(),
      storeSettings: { create: { smsCredits: 50 } },
    },
  });

  const verificationAttempts = await Promise.allSettled(
    Array.from({ length: 5 }, () => verifyOnce(verifyToken, inviteeId)),
  );
  const inviteeSettings = await prisma.storeSettings.findUniqueOrThrow({ where: { tenantId: inviteeId } });
  assert.equal(inviteeSettings.smsCredits, 100);
  assert.equal(verificationAttempts.filter((item) => item.status === "fulfilled" && item.value === 50).length, 1);

  const rewardAttempts = await Promise.allSettled(
    Array.from({ length: 5 }, () => rewardOnce(inviteeId)),
  );
  const referrerSettings = await prisma.storeSettings.findUniqueOrThrow({ where: { tenantId: referrerId } });
  assert.equal(referrerSettings.smsCredits, 150);
  assert.equal(rewardAttempts.filter((item) => item.status === "fulfilled" && item.value).length, 1);

  const eventId = `evt_qa_release_${runId}`;
  const claims = await Promise.allSettled(Array.from({ length: 5 }, () =>
    prisma.processedStripeEvent.create({
      data: { id: eventId, type: "checkout.session.completed", tenantId: inviteeId },
    })
  ));
  assert.equal(claims.filter((item) => item.status === "fulfilled").length, 1);

  console.log(JSON.stringify({
    verificationBonusWinners: 1,
    inviteeFinalCredits: inviteeSettings.smsCredits,
    conversionRewardWinners: 1,
    referrerFinalCredits: referrerSettings.smsCredits,
    stripeEventClaimWinners: 1,
  }, null, 2));
} finally {
  await prisma.processedStripeEvent.deleteMany({ where: { tenantId: { in: [referrerId, inviteeId] } } });
  await prisma.tenant.deleteMany({ where: { id: { in: [referrerId, inviteeId] } } });
  await prisma.$disconnect();
}
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
