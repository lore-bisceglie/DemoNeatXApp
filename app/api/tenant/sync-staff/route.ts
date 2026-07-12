import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncStaffFromSheet } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    const { tenantId, url } = await request.json();

    if (!tenantId || !url) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { staffSheetUrl: url }
    });

    await syncStaffFromSheet(url, tenantId);

    return NextResponse.json({ success: true, message: "Orari sincronizzati con successo!" });

  } catch (error: any) {
    console.error("Sync Staff API Error:", error);
    return NextResponse.json({ error: error.message || "Errore interno durante la sincronizzazione" }, { status: 500 });
  }
}
