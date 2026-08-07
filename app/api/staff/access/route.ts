import { NextResponse } from "next/server";
import { buildStaffPortalUrl, createStaffAccessToken, hashStaffAccessToken } from "@/lib/staff-access";
import { prisma } from "@/lib/prisma";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";

export const dynamic = "force-dynamic";

async function getStaffForAdmin(staffId: string, request: Request) {
  const staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { id: true, name: true, tenantId: true, staffAccessTokenCreatedAt: true, staffAccessTokenRevokedAt: true } });
  if (!staff) return { error: NextResponse.json({ error: "Collaboratore non trovato" }, { status: 404 }) };
  const authError = await requireTenantAdminOrDemo(request, staff.tenantId, "staff-access", 60);
  if (authError) return { error: authError };
  return { staff };
}

export async function GET(request: Request) {
  const staffId = new URL(request.url).searchParams.get("staffId");
  if (!staffId) return NextResponse.json({ error: "Manca staffId" }, { status: 400 });
  const result = await getStaffForAdmin(staffId, request);
  if (result.error) return result.error;
  return NextResponse.json({
    active: Boolean(result.staff?.staffAccessTokenCreatedAt && !result.staff.staffAccessTokenRevokedAt),
    createdAt: result.staff?.staffAccessTokenCreatedAt,
    revokedAt: result.staff?.staffAccessTokenRevokedAt,
  });
}

export async function POST(request: Request) {
  let body: { staffId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Payload non valido" }, { status: 400 }); }
  if (!body.staffId) return NextResponse.json({ error: "Manca staffId" }, { status: 400 });
  const result = await getStaffForAdmin(body.staffId, request);
  if (result.error || !result.staff) return result.error || NextResponse.json({ error: "Collaboratore non trovato" }, { status: 404 });

  const token = createStaffAccessToken();
  await prisma.staff.update({
    where: { id: result.staff.id },
    data: {
      staffAccessTokenHash: hashStaffAccessToken(token),
      staffAccessTokenCreatedAt: new Date(),
      staffAccessTokenRevokedAt: null,
      staffAccessLastUsedAt: null,
    },
    select: { id: true },
  });
  return NextResponse.json({ url: buildStaffPortalUrl(request, token), createdAt: new Date().toISOString() });
}

export async function DELETE(request: Request) {
  let body: { staffId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Payload non valido" }, { status: 400 }); }
  if (!body.staffId) return NextResponse.json({ error: "Manca staffId" }, { status: 400 });
  const result = await getStaffForAdmin(body.staffId, request);
  if (result.error || !result.staff) return result.error || NextResponse.json({ error: "Collaboratore non trovato" }, { status: 404 });
  await prisma.staff.update({
    where: { id: result.staff.id },
    data: { staffAccessTokenRevokedAt: new Date() },
    select: { id: true },
  });
  return NextResponse.json({ success: true });
}
