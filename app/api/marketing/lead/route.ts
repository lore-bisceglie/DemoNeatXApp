import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { checkRequestRateLimit } from '@/lib/request-rate-limit';

export async function POST(req: Request) {
  try {
    const rate = await checkRequestRateLimit(req, 'marketing-lead', 10, 60 * 60);
    if (!rate.success) {
      return NextResponse.json({ error: 'Troppe richieste' }, { status: 429 });
    }
    const { name, email, phone, source = 'lead_magnet' } = await req.json();

    if (!name || String(name).length > 100 || String(email || '').length > 254 || String(phone || '').length > 30) {
      return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: { name, email, phone, source, status: 'new' },
    });

    await sendTelegramMessage(
      `🚨 <b>NUOVO LEAD!</b> 🚨\n\n` +
      `👤 <b>${name}</b>\n` +
      `📧 ${email || 'non fornita'}\n` +
      `📱 ${phone || 'non fornito'}\n` +
      `📌 Fonte: ${source}\n` +
      `🆔 ${lead.id}`
    );

    return NextResponse.json({ success: true, id: lead.id });
  } catch (error) {
    console.error('Errore API Marketing Lead:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
