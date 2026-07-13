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
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET non configurato');
      return NextResponse.json({ error: 'Webhook non configurato' }, { status: 500 });
    }
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
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

        if (metadataType === 'appointment_deposit' && session.metadata?.appointmentId) {
          await prisma.appointment.update({
            where: { id: session.metadata.appointmentId },
            data: { isPaid: true, paymentStatus: 'PAID' },
          });
          const appt = await prisma.appointment.findUnique({
            where: { id: session.metadata.appointmentId },
            include: { tenant: true },
          });
          await sendTelegramMessage(
            `✅ <b>CAPARRA PAGATA</b>\n\nPrenotazione <b>${appt?.id}</b> del negozio <b>${appt?.tenant?.name || ''}</b> confermata e pagata.`
          );
        } else if (tenantId && metadataType === 'message_package') {
          const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
          const packageId = session.metadata?.packageId || 'unknown';
          if (creditsToAdd > 0) {
            const ss = await prisma.storeSettings.upsert({
              where: { tenantId },
              create: { tenantId, smsCredits: creditsToAdd },
              update: { smsCredits: { increment: creditsToAdd } },
            });
            const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
            await sendTelegramMessage(
              `💬 <b>VENDITA MESSAGGI!</b>\n\nIl negozio <b>${tenant?.name || tenantId}</b>` +
              ` ha acquistato il pacchetto <b>${packageId}</b>.\n+${creditsToAdd} crediti. Totale: <b>${ss.smsCredits}</b> 📈`
            );
          }
        } else if (tenantId) {
          const purchasedPlan = session.metadata?.plan || 'pro';
          const interval = session.metadata?.interval || 'month';
          const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              plan: purchasedPlan,
              trialStatus: 'converted',
              trialEndsAt: null,
            }
          });
          await sendTelegramMessage(
            `💰 <b>PAGAMENTO SAAS!</b>\n\nIl negozio <b>${updatedTenant.name}</b> ha attivato <b>${purchasedPlan.toUpperCase()}</b> (${interval === 'year' ? 'annuale' : 'mensile'})!\nMRR in aumento. 📈`
          );

          // Referral reward: se è stato invitato, premia chi lo ha invitato
          if (updatedTenant.referredByCode) {
            const referrer = await prisma.tenant.findUnique({ where: { referralCode: updatedTenant.referredByCode } });
            if (referrer) {
              await prisma.storeSettings.upsert({
                where: { tenantId: referrer.id },
                create: { tenantId: referrer.id, smsCredits: 100 },
                update: { smsCredits: { increment: 100 } },
              });
              await sendTelegramMessage(
                `🎉 <b>REFERRAL PREMIATO!</b>\n\n<b>${referrer.name}</b> ha guadagnato 100 crediti WhatsApp per aver invitato <b>${updatedTenant.name}</b>!\nPiù inviti, più messaggi gratis. 🚀`
              );
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const tenantId = invoice.subscription_details?.metadata?.tenant_id || invoice.metadata?.tenant_id;
        if (tenantId) {
          const subscriptionId = invoice.subscription;
          console.warn(`[Stripe] Pagamento fallito per tenant ${tenantId}, subscription ${subscriptionId}`);
          const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
          await sendTelegramMessage(
            `❌ <b>PAGAMENTO FALLITO!</b>\n\nIl negozio <b>${tenant?.name || tenantId}</b> ha il pagamento della carta fallito.\nAbbonamento non rinnovato. ⚠️`
          );
        }
        break;
      }

      case 'invoice.paid': {
        const paidInvoice = event.data.object as any;
        const paidTenantId = paidInvoice.subscription_details?.metadata?.tenant_id || paidInvoice.metadata?.tenant_id;
        if (paidTenantId) {
          console.log(`[Stripe] Rinnovo pagato per tenant ${paidTenantId}`);
          const tenant = await prisma.tenant.findUnique({ where: { id: paidTenantId } });
          await sendTelegramMessage(
            `🔄 <b>RINNOVO SAAS!</b>\n\nIl negozio <b>${tenant?.name || paidTenantId}</b> ha rinnovato l'abbonamento.\nMRR confermato. ✅`
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const subTenantId = subscription.metadata?.tenant_id;
        if (subTenantId) {
          await prisma.tenant.update({
            where: { id: subTenantId },
            data: { trialStatus: 'expired', plan: 'basic', trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          });
          const tenant = await prisma.tenant.findUnique({ where: { id: subTenantId } });
          await sendTelegramMessage(
            `🚫 <b>ABBONAMENTO CANCELLATO</b>\n\nIl negozio <b>${tenant?.name || subTenantId}</b> ha cancellato l'abbonamento.\nRetrocesso a trial scaduto.`
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subUpdate = event.data.object as any;
        const subUpdateTenantId = subUpdate.metadata?.tenant_id;
        if (subUpdateTenantId && subUpdate.status === 'past_due') {
          await sendTelegramMessage(
            `⚠️ <b>ABBONAMENTO IN RITARDO</b>\n\nIl tenant <b>${subUpdateTenantId}</b> ha un pagamento in ritardo (past_due).`
          );
        }
        break;
      }

      default:
        console.log(`Evento non gestito: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Errore webhook Stripe:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
