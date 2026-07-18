import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncStaffFromSheet } from "@/lib/sheets";
import { requireTenantAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { tenantId } = await request.json();

    if (!tenantId) {
      return new NextResponse("Tenant ID richiesto", { status: 400 });
    }
  const authError = await requireTenantAdmin(tenantId);
  if (authError) return authError;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, staffSheetUrl: true }
    });

    if (!tenant || !tenant.staffSheetUrl) {
      return new NextResponse("URL Google Sheet non configurato per questo tenant", { status: 400 });
    }

    const result = await syncStaffFromSheet(tenant.staffSheetUrl, tenant.id);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Errore durante la sincronizzazione Google Sheets:", error);
    return new NextResponse(error.message || "Errore interno durante la sincronizzazione", { status: 500 });
  }
}
