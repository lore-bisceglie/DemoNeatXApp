import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'Sconosciuto';
    const userAgent = req.headers.get('user-agent') || 'Sconosciuto';
    
    // Rileva dispositivo in modo base
    const isMobile = /mobile|android|iphone/i.test(userAgent) ? '📱 Mobile' : '💻 Desktop';
    
    const text = `👀 <b>VISITA ALLA DEMO</b> 👀\n\nQualcuno sta provando la Demo Pubblica (Vetrina)!\n<b>Dispositivo:</b> ${isMobile}\n<b>IP:</b> ${ip}`;

    await sendTelegramMessage(text);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Demo visit endpoint error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
