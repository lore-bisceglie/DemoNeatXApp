import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { requireTenantAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { tenantId, message } = await req.json();

    if (!tenantId || !message) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    const authError = await requireTenantAdmin(tenantId);
    if (authError) return authError;
    if (typeof message !== 'string' || message.trim().length > 2000) {
      return NextResponse.json({ error: 'Messaggio non valido' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
    }

    const text = `⚠️ <b>SEGNALAZIONE SUPPORTO / BUG</b> ⚠️\n\n<b>Da:</b> ${tenant.name}\n<b>Slug:</b> ${tenant.slug}.neatx.store\n<b>Telefono:</b> ${tenant.phone || 'Non specificato'}\n\n<b>Messaggio:</b>\n<i>"${message}"</i>`;

    await sendTelegramMessage(text);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Support endpoint error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
