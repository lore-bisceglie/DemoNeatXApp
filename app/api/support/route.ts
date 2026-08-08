import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { requireTenantAdmin } from '@/lib/auth';

// Escape HTML per evitare che testo utente rompa la formattazione del messaggio
function escapeTelegramHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

    const text = `⚠️ <b>SEGNALAZIONE SUPPORTO / BUG</b> ⚠️\n\n👤 Da: <b>${escapeTelegramHtml(tenant.name)}</b>\n🔗 Slug: <b>${escapeTelegramHtml(tenant.slug)}.neatx.store</b>\n📱 Telefono: <b>${escapeTelegramHtml(tenant.phone || 'Non specificato')}</b>\n\n📝 Messaggio:\n<i>"${escapeTelegramHtml(message)}"</i>`;

    await sendTelegramMessage(text);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Support endpoint error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
