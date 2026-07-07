import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Firma mancante' }, { status: 400 });
  }

  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } else {
      // Fallback per sviluppo se non si ha il webhook secret
      event = JSON.parse(payload);
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: 'Firma non valida' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const tenantId = session.client_reference_id;

        if (tenantId) {
          console.log(`Abbonamento completato per il tenant ${tenantId}`);
          const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              plan: 'premium',
              trialStatus: 'converted',
              trialEndsAt: null, // Rimuove la scadenza della prova
            }
          });

          // Notifica God-Eye su Telegram
          await sendTelegramMessage(
            `💰 <b>KA-CHING! INCASSO SAAS!</b>\n\n` +
            `Il negozio <b>${updatedTenant.name}</b> ha appena pagato l'abbonamento tramite Stripe!\n` +
            `MRR (Ricavo Mensile Ricorrente) in aumento. 📈`
          );
        }
        break;
      }
      // Qui si possono aggiungere listener per 'invoice.payment_failed' ecc.
      default:
        console.log(`Evento non gestito: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Errore durante l\'aggiornamento del DB nel webhook:', error);
    return NextResponse.json({ error: 'Errore interno al DB' }, { status: 500 });
  }
}
