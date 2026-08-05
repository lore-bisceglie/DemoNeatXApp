import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_BYTES = 32;

export function createStaffAccessToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashStaffAccessToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isStaffAccessTokenFormatValid(token: string | null | undefined): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{40,64}$/.test(token);
}

export async function findStaffByAccessToken(token: string | null | undefined) {
  if (!isStaffAccessTokenFormatValid(token)) return null;
  const staff = await prisma.staff.findUnique({
    where: { staffAccessTokenHash: hashStaffAccessToken(token) },
    select: {
      id: true,
      name: true,
      tenantId: true,
      baseSchedule: true,
      shiftExceptions: true,
      staffAccessTokenRevokedAt: true,
      staffAccessLastUsedAt: true,
      location: {
        select: {
          openTime: true,
          closeTime: true,
          breakStart: true,
          breakEnd: true,
          closedDays: true,
        },
      },
      locations: {
        select: {
          location: {
            select: {
              openTime: true,
              closeTime: true,
              breakStart: true,
              breakEnd: true,
              closedDays: true,
            },
          },
        },
      },
      tenant: {
        select: {
          name: true,
          slug: true,
          openTime: true,
          closeTime: true,
          breakStart: true,
          breakEnd: true,
          closedDays: true,
        },
      },
    },
  });
  if (!staff || staff.staffAccessTokenRevokedAt) return null;
  return staff;
}

export function buildStaffPortalUrl(request: Request, token: string): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const origin = configuredOrigin || new URL(request.url).origin;
  return `${origin}/staff/${token}`;
}
