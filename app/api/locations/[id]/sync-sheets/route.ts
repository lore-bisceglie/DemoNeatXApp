import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncStaffFromSheet } from '@/lib/sheets';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL mancante" }, { status: 400 });
    }

    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) {
      return NextResponse.json({ error: "Sede non trovata" }, { status: 404 });
    }

    await prisma.location.update({
      where: { id },
      data: { staffSheetUrl: url },
    });

    await syncStaffFromSheet(url, location.tenantId, id);

    return NextResponse.json({ success: true, message: "Orari sincronizzati con successo per la sede!" });

  } catch (error: any) {
    console.error("Sync Location Sheets API Error:", error);
    return NextResponse.json({ error: error.message || "Errore interno" }, { status: 500 });
  }
}
