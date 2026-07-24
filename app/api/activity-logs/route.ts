import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { isTenantAdminCookieValid } from "@/lib/auth";

// GET: Fetch activity logs for a tenant
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId mancante" }, { status: 400 });
    }

    // Auth check: must be admin of this tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, sessionVersion: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant non trovato" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const authCookie = cookieStore.get(`admin_auth_${tenant.slug}`)?.value;
    const isSuperAdmin = cookieStore.get("superadmin_session")?.value;

    if (!isSuperAdmin && !isTenantAdminCookieValid(authCookie, tenant.slug, tenant.sessionVersion)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where: { tenantId } }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Errore fetch activity logs:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
