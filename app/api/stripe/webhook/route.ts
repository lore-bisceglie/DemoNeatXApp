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
        const metadataType = session.metadata?.type;

        if (tenantId && metadataType === 'message_package') {
          // --- PACCHETTO MESSAGGI WHATSAPP/SMS ---
          const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
          const packageId = session.metadata?.packageId || 'unknown';

          if (creditsToAdd > 0) {
            const storeSettings = await prisma.storeSettings.upsert({
              where: { tenantId },
              create: { tenantId, smsCredits: creditsToAdd },
              update: { smsCredits: { increment: creditsToAdd } },
            });

            const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

            console.log(`✅ Pacchetto messaggi: +${creditsToAdd} crediti per ${tenantId}. Totale: ${storeSettings.smsCredits}`);

            await sendTelegramMessage(
              `💬 <b>VENDITA MESSAGGI!</b>\n\n` +
              `Il negozio <b>${tenant?.name || tenantId}</b> ha acquistato il pacchetto <b>${packageId}</b>.\n` +
              `+${creditsToAdd} crediti aggiunti automaticamente.\n` +
              `Totale crediti: <b>${storeSettings.smsCredits}</b> 📈`
            );
          }
        } else if (tenantId) {
          // --- ABBONAMENTO SAAS (logica esistente) ---
          const purchasedPlan = session.metadata?.plan || 'pro';

          console.log(`Abbonamento completato per il tenant ${tenantId}`);
          const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              plan: purchasedPlan,
              trialStatus: 'converted',
              trialEndsAt: null,
            }
          });

          await sendTelegramMessage(
            `💰 <b>KA-CHING! INCASSO SAAS!</b>\n\n` +
            `Il negozio <b>${updatedTenant.name}</b> ha appena pagato l'abbonamento <b>${purchasedPlan.toUpperCase()}</b>!\n` +
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
