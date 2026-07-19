export function normalizeReferralCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 32);
}

export function normalizeReferralIdentity(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}

export function normalizeReferralPhone(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") || "";
  if (!digits) return "";
  return digits.startsWith("39") ? digits : `39${digits}`;
}

export function isSelfReferral(
  invitee: { email: string; phone: string },
  referrer: { email?: string | null; phone?: string | null },
) {
  return (
    normalizeReferralIdentity(invitee.email) === normalizeReferralIdentity(referrer.email) ||
    normalizeReferralPhone(invitee.phone) === normalizeReferralPhone(referrer.phone)
  );
}
