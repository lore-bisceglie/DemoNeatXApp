import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { Prisma } from '@prisma/client';
import { awardReferrerForConversion } from '@/lib/referral';
import { sendPaymentFailedEmail, sendSubscriptionActivatedEmail, sendSubscriptionCanceledEmail } from '@/lib/email';
import { getTenantAdminUrl } from '@/lib/domains';

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
    await prisma.processedStripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
        tenantId: typeof (event.data.object as any)?.client_reference_id === 'string'
          ? (event.data.object as any).client_reference_id
          : null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.processedStripeEvent.findUnique({ where: { id: event.id } });
      if (existing?.status === 'processed') {
        return NextResponse.json({ received: true, duplicate: true });
      }
      return NextResponse.json({ error: 'Evento già in elaborazione' }, { status: 409 });
    }
    throw error;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const tenantId = session.client_reference_id;
        const metadataType = session.metadata?.type;

        if (
          metadataType === 'appointment_deposit' &&
          session.payment_status === 'paid' &&
          session.metadata?.appointmentId &&
          session.metadata?.tenantSlug
        ) {
          const paid = await prisma.appointment.updateMany({
            where: {
              id: session.metadata.appointmentId,
              stripeSession: session.id,
              isPaid: false,
              tenant: { slug: session.metadata.tenantSlug },
            },
            data: { isPaid: true, paymentStatus: 'PAID' },
          });
          if (paid.count === 0) break;
          const appt = await prisma.appointment.findUnique({
            where: { id: session.metadata.appointmentId },
            include: { tenant: true },
          });
          await sendTelegramMessage(
            `✅ <b>CAPARRA PAGATA</b>\n\n` +
            `🏪 <b>${appt?.tenant?.name || ''}</b>\n` +
            `📅 Prenotazione: <b>${appt?.date || ''}</b> alle <b>${appt?.time || ''}</b>\n` +
            `👤 Cliente: <b>${appt?.customerName || ''}</b>`
          );
        } else if (tenantId && metadataType === 'message_package' && session.payment_status === 'paid') {
          const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
          const packageId = session.metadata?.packageId || 'unknown';
          if (creditsToAdd > 0) {
            const ss = await prisma.$transaction(async (tx) => {
              const alreadyProcessed = await tx.activityLog.findFirst({
                where: {
                  tenantId,
                  action: 'STRIPE_MESSAGE_PACKAGE',
                  metadata: session.id,
                },
                select: { id: true },
              });
              if (alreadyProcessed) return null;
              const updatedSettings = await tx.storeSettings.upsert({
                where: { tenantId },
                create: { tenantId, smsCredits: creditsToAdd },
                update: { smsCredits: { increment: creditsToAdd } },
              });
              await tx.activityLog.create({
                data: {
                  tenantId,
                  action: 'STRIPE_MESSAGE_PACKAGE',
                  actor: 'stripe',
                  message: `Pacchetto ${packageId} accreditato`,
                  metadata: session.id,
                },
              });
              return updatedSettings;
            }, { isolationLevel: 'Serializable' });
            if (!ss) break;
            const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
            await sendTelegramMessage(
              `💬 <b>PACCHETTO MESSAGGI</b>\n\n` +
              `🏪 <b>${tenant?.name || tenantId}</b>\n` +
              `📦 Pacchetto: <b>${packageId}</b> (+${creditsToAdd} crediti)\n` +
              `📊 Saldo attuale: <b>${ss.smsCredits}</b> messaggi`
            );
          }
        } else if (tenantId && metadataType === 'subscription' && session.status === 'complete') {
          const purchasedPlan = ['pro', 'elite'].includes(session.metadata?.plan)
            ? session.metadata.plan
            : null;
          const interval = ['month', 'year'].includes(session.metadata?.interval)
            ? session.metadata.interval
            : null;
          if (!purchasedPlan || !interval) break;
          const stripeCustomerId = session.customer as string;
          const stripeSubscriptionId = session.subscription as string;
          const updateData: any = {
            plan: purchasedPlan,
            trialStatus: 'converted',
            trialEndsAt: null,
            convertedAt: new Date(),
          };
          if (stripeCustomerId) updateData.stripeCustomerId = stripeCustomerId;
          if (stripeSubscriptionId) updateData.stripeSubscriptionId = stripeSubscriptionId;
          const activated = await prisma.tenant.updateMany({
            where: { id: tenantId, trialStatus: { not: 'converted' } },
            data: updateData,
          });
          if (activated.count === 0) break;
          const updatedTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
          if (!updatedTenant) break;
          if (updatedTenant.ownerEmail) {
            await sendSubscriptionActivatedEmail(
              updatedTenant.ownerEmail,
              updatedTenant.name,
              updatedTenant.ownerName || "titolare",
              purchasedPlan,
              interval,
              getTenantAdminUrl(updatedTenant.slug),
            );
          }
          await sendTelegramMessage(
            `🟢 <b>NUOVO ABBONAMENTO</b>\n\n` +
            `🏪 <b>${updatedTenant.name}</b>\n` +
            `📦 Piano: <b>${purchasedPlan === 'elite' ? 'Elite' : 'Pro'}</b>\n` +
            `🔄 Ciclo: <b>${interval === 'year' ? 'Annuale' : 'Mensile'}</b>\n` +
            `💰 Prezzo: <b>${interval === 'year' ? (purchasedPlan === 'elite' ? '590€' : '290€') : (purchasedPlan === 'elite' ? '59€' : '29€')}</b>`
          );

          const referralReward = await awardReferrerForConversion(tenantId, 'stripe');
          if (referralReward.rewarded) {
            await sendTelegramMessage(
              `🎁 <b>PROGRAMMA INVITI</b>\n\n<b>${referralReward.referrerName}</b> ha ricevuto ${referralReward.credits} messaggi per la prima attivazione pagata di <b>${referralReward.referredTenantName}</b>.`
            );
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
          if (tenant?.ownerEmail) {
            await sendPaymentFailedEmail(
              tenant.ownerEmail,
              tenant.name,
              tenant.ownerName || "titolare",
              getTenantAdminUrl(tenant.slug),
            );
          }
          await sendTelegramMessage(
            `❌ <b>PAGAMENTO FALLITO</b>\n\n` +
            `🏪 <b>${tenant?.name || tenantId}</b>\n` +
            `⚠️ Il rinnovo della carta è fallito. Stripe riproverà nei prossimi giorni, altrimenti l'abbonamento verrà cancellato.`
          );
        }
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const paidInvoice = event.data.object as any;
        const paidTenantId = paidInvoice.subscription_details?.metadata?.tenant_id || paidInvoice.metadata?.tenant_id;
        if (paidTenantId) {
          console.log(`[Stripe] Rinnovo pagato per tenant ${paidTenantId}`);
          const tenant = await prisma.tenant.findUnique({ where: { id: paidTenantId } });
          await sendTelegramMessage(
            `🔄 <b>RINNOVO PAGATO</b>\n\n` +
            `🏪 <b>${tenant?.name || paidTenantId}</b>\n` +
            `✅ Rinnovo abbonamento confermato e pagato con successo.`
          );
        }
        break;
      }

      case 'customer.subscription.created': {
        const subCreate = event.data.object as any;
        const subCreateTenantId = subCreate.metadata?.tenant_id;
        if (subCreateTenantId) {
          const plan = ['pro', 'elite'].includes(subCreate.metadata?.plan)
            ? subCreate.metadata.plan
            : undefined;
          const updateData: any = {
            stripeSubscriptionId: subCreate.id,
          };
          if (subCreate.customer) updateData.stripeCustomerId = subCreate.customer;
          if (plan && ['active', 'trialing'].includes(subCreate.status)) {
            updateData.plan = plan;
            updateData.trialStatus = 'converted';
            updateData.trialEndsAt = null;
            updateData.convertedAt = new Date();
          }
          await prisma.tenant.update({ where: { id: subCreateTenantId }, data: updateData });
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
          if (tenant?.ownerEmail) {
            await sendSubscriptionCanceledEmail(
              tenant.ownerEmail,
              tenant.name,
              tenant.ownerName || "titolare",
              new URL(`/paywall/${tenant.slug}`, getTenantAdminUrl(tenant.slug)).toString(),
            );
          }
          await sendTelegramMessage(
            `🚫 <b>ABBONAMENTO CANCELLATO</b>\n\n` +
            `🏪 <b>${tenant?.name || subTenantId}</b>\n` +
            `📉 L'abbonamento è stato cancellato. Il negozio è stato retrocesso a piano Basic e vedrà il paywall.`
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subUpdate = event.data.object as any;
        const subUpdateTenantId = subUpdate.metadata?.tenant_id;
        if (subUpdateTenantId) {
          const updateData: any = {};
          if (subUpdate.id) updateData.stripeSubscriptionId = subUpdate.id;
          if (subUpdate.customer) updateData.stripeCustomerId = subUpdate.customer;
          
          const plan = ['pro', 'elite'].includes(subUpdate.metadata?.plan)
            ? subUpdate.metadata.plan
            : undefined;
            
          if (plan && ['active', 'trialing'].includes(subUpdate.status)) {
            updateData.plan = plan;
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.tenant.update({ where: { id: subUpdateTenantId }, data: updateData });
          }
          if (subUpdate.status === 'past_due') {
            await sendTelegramMessage(
              `⚠️ <b>PAGAMENTO IN RITARDO</b>\n\n` +
              `🏪 ID: <b>${subUpdateTenantId}</b>\n` +
              `⏳ Lo Stripe subscription è in stato <b>past_due</b>. Il cliente deve aggiornare la carta.`
            );
          } else if (subUpdate.status === 'active' && subUpdate.previous_attributes?.status === 'past_due') {
            await sendTelegramMessage(
              `✅ <b>PAGAMENTO RIPRISTINATO</b>\n\n` +
              `🏪 ID: <b>${subUpdateTenantId}</b>\n` +
              `🔄 Il pagamento è stato risolto. L'abbonamento è di nuovo attivo.`
            );
          }
        }
        break;
      }

      default:
        console.log(`Evento non gestito: ${event.type}`);
    }

    await prisma.processedStripeEvent.update({
      where: { id: event.id },
      data: { status: 'processed', processedAt: new Date() },
    });
    return NextResponse.json({ received: true });
  } catch (error: any) {
    await prisma.processedStripeEvent.delete({ where: { id: event.id } }).catch(() => undefined);
    console.error('Errore webhook Stripe:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
