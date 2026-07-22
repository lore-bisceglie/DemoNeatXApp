import "server-only";

import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  shouldSendWelcomeAfterVerification,
  storedEmailVerificationToken,
} from "@/lib/email-verification";
import {
  isSelfReferral,
  normalizeReferralCode,
  normalizeReferralIdentity,
  normalizeReferralPhone,
} from "@/lib/referral-utils";

export { normalizeReferralCode, normalizeReferralIdentity, normalizeReferralPhone } from "@/lib/referral-utils";

export const INITIAL_MESSAGE_CREDITS = 50;
export const REFERRED_SIGNUP_BONUS_CREDITS = 50;
export const REFERRER_CONVERSION_REWARD_CREDITS = 100;

export async function ensureReferralCode(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, referralCode: true },
  });
  if (!tenant) return null;
  if (tenant.referralCode) return tenant.referralCode;

  const base = normalizeReferralCode(tenant.name || tenant.slug).slice(0, 10) || "NEATX";
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = `${base}${randomBytes(3).toString("hex").toUpperCase()}`;
    try {
      const assigned = await prisma.tenant.updateMany({
        where: { id: tenant.id, referralCode: null },
        data: { referralCode: candidate },
      });
      if (assigned.count === 1) return candidate;
      return (await prisma.tenant.findUnique({
        where: { id: tenant.id },
        select: { referralCode: true },
      }))?.referralCode || null;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("Impossibile generare un codice invito univoco.");
}

export async function findEligibleReferrer(rawCode: string, emailValue: string, phoneValue: string) {
  const code = normalizeReferralCode(rawCode);
  const email = normalizeReferralIdentity(emailValue);
  const phone = normalizeReferralPhone(phoneValue);
  if (!code || !email || !phone) return null;

  const referrer = await prisma.tenant.findUnique({
    where: { referralCode: code },
    select: { id: true, referralCode: true, ownerEmail: true, phone: true },
  });
  if (!referrer?.referralCode) return null;
  if (isSelfReferral(
    { email, phone },
    { email: referrer.ownerEmail, phone: referrer.phone },
  )) return null;

  const candidates = await prisma.tenant.findMany({
    where: { OR: [{ ownerEmail: { equals: email, mode: "insensitive" } }, { phone: { not: null } }] },
    select: { ownerEmail: true, phone: true },
  });
  const duplicate = candidates.some((item) =>
    normalizeReferralIdentity(item.ownerEmail) === email ||
    normalizeReferralPhone(item.phone) === phone
  );
  return duplicate ? null : { id: referrer.id, code: referrer.referralCode };
}

export async function verifyTenantAndGrantReferralBonus(token: string, slug: string) {
  const storedToken = storedEmailVerificationToken(token);
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findFirst({
      where: {
        slug,
        emailVerifyToken: storedToken,
        emailVerified: false,
        OR: [
          { emailVerifyExpiresAt: null },
          { emailVerifyExpiresAt: { gt: now } },
        ],
      },
      select: {
        id: true,
        slug: true,
        ownerEmail: true,
        ownerName: true,
        referredByCode: true,
        referralSignupBonusAt: true,
      },
    });
    if (!tenant) return null;

    const grantBonus = Boolean(tenant.referredByCode && !tenant.referralSignupBonusAt);
    const changed = await tx.tenant.updateMany({
      where: {
        id: tenant.id,
        emailVerifyToken: storedToken,
        emailVerified: false,
        OR: [
          { emailVerifyExpiresAt: null },
          { emailVerifyExpiresAt: { gt: now } },
        ],
      },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
        ...(grantBonus ? { referralSignupBonusAt: new Date() } : {}),
      },
    });
    if (changed.count !== 1) return null;

    if (grantBonus) {
      await tx.storeSettings.update({
        where: { tenantId: tenant.id },
        data: { smsCredits: { increment: REFERRED_SIGNUP_BONUS_CREDITS } },
      });
      await tx.activityLog.create({
        data: {
          tenantId: tenant.id,
          action: "REFERRAL_SIGNUP_BONUS",
          actor: "system",
          message: `Accreditati ${REFERRED_SIGNUP_BONUS_CREDITS} messaggi dopo la verifica email.`,
          metadata: tenant.referredByCode,
        },
      });
    }
    return {
      tenantId: tenant.id,
      slug: tenant.slug,
      ownerEmail: tenant.ownerEmail,
      ownerName: tenant.ownerName,
      shouldSendWelcomeEmail: shouldSendWelcomeAfterVerification(token),
      bonusCredits: grantBonus ? REFERRED_SIGNUP_BONUS_CREDITS : 0,
    };
  }, { isolationLevel: "Serializable" });
}

export async function awardReferrerForConversion(
  referredTenantId: string,
  actor: "stripe" | "superadmin" | "telegram",
) {
  return prisma.$transaction(async (tx) => {
    const referred = await tx.tenant.findUnique({
      where: { id: referredTenantId },
      select: { id: true, name: true, referredByCode: true, referralRewardedAt: true },
    });
    if (!referred?.referredByCode || referred.referralRewardedAt) return { rewarded: false as const };

    const referrer = await tx.tenant.findUnique({
      where: { referralCode: referred.referredByCode },
      select: { id: true, name: true },
    });
    if (!referrer || referrer.id === referred.id) return { rewarded: false as const };

    const marked = await tx.tenant.updateMany({
      where: { id: referred.id, referralRewardedAt: null },
      data: { referralRewardedAt: new Date() },
    });
    if (marked.count !== 1) return { rewarded: false as const };

    const settings = await tx.storeSettings.update({
      where: { tenantId: referrer.id },
      data: { smsCredits: { increment: REFERRER_CONVERSION_REWARD_CREDITS } },
    });
    await tx.activityLog.create({
      data: {
        tenantId: referrer.id,
        action: "REFERRAL_CONVERSION_REWARD",
        actor,
        message: `Accreditati ${REFERRER_CONVERSION_REWARD_CREDITS} messaggi per la prima attivazione di ${referred.name}.`,
        metadata: referred.id,
      },
    });
    return {
      rewarded: true as const,
      referrerName: referrer.name,
      referredTenantName: referred.name,
      credits: REFERRER_CONVERSION_REWARD_CREDITS,
      balance: settings.smsCredits,
    };
  }, { isolationLevel: "Serializable" });
}
