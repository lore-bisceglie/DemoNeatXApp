import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 });
    }

    // Qui potresti anche salvare l'email in un database locale o su Mailchimp/Resend Audience
    // await prisma.lead.create({ data: { name, email } });

    // Invia la notifica Telegram al God-Eye
    await sendTelegramMessage(
      `🚨 <b>NUOVO LEAD SAAS!</b> 🚨\n\n` +
      `Qualcuno ha appena scaricato la guida gratuita e potrebbe essere interessato a NeatX.\n\n` +
      `👤 Nome: <b>${name}</b>\n` +
      `📧 Email: <b>${email}</b>`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore API Marketing Lead:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
