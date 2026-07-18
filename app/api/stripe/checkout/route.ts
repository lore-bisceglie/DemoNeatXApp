import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

function getBaseUrl(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const { appointmentId, bookingToken } = await request.json();
    if (
      typeof appointmentId !== "string" ||
      !appointmentId ||
      typeof bookingToken !== "string" ||
      !bookingToken
    ) {
      return NextResponse.json({ error: "Appuntamento mancante" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: { select: { id: true, name: true, price: true } },
        tenant: { include: { storeSettings: true } },
        location: { include: { settings: true } },
      },
    });

    if (!appointment?.tenant || !appointment.service) {
      return NextResponse.json({ error: "Appuntamento non valido" }, { status: 404 });
    }
    if (appointment.cancelToken !== bookingToken) {
      return NextResponse.json({ error: "Prenotazione non autorizzata" }, { status: 401 });
    }
    if (appointment.isPaid || appointment.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Appuntamento già pagato" }, { status: 409 });
    }

    const tenant = appointment.tenant;
    const locationSettings = appointment.location?.settings;
    const settings = locationSettings && locationSettings.paymentStrategy !== "OFF"
      ? locationSettings
      : tenant.storeSettings;
    const stripeAccountId =
      appointment.location?.settings?.stripeAccountId || tenant.storeSettings?.stripeAccountId;

    if (!settings || settings.paymentStrategy === "OFF") {
      return NextResponse.json({ error: "Pagamento online non attivo" }, { status: 400 });
    }
    if (!stripeAccountId || stripeAccountId.startsWith("acct_demo_")) {
      return NextResponse.json({ error: "Account Stripe non configurato" }, { status: 400 });
    }

    let servicePrice = appointment.service.price || 0;
    if (appointment.locationId) {
      const locationPrice = await prisma.serviceLocation.findUnique({
        where: {
          serviceId_locationId: {
            serviceId: appointment.service.id,
            locationId: appointment.locationId,
          },
        },
        select: { price: true, isActive: true },
      });
      if (!locationPrice?.isActive) {
        return NextResponse.json({ error: "Servizio non disponibile" }, { status: 400 });
      }
      servicePrice = locationPrice.price ?? servicePrice;
    }

    const strategy = settings.paymentStrategy.toUpperCase();
    let amountEur = 0;
    if (strategy === "FIXED") {
      amountEur = settings.paymentFixedAmount || 0;
    } else if (strategy === "PERCENTAGE") {
      amountEur = servicePrice * ((settings.paymentPercentage || 0) / 100);
    } else {
      return NextResponse.json({ error: "Strategia pagamento non valida" }, { status: 400 });
    }

    const unitAmount = Math.round(amountEur * 100);
    if (!Number.isFinite(unitAmount) || unitAmount < 50 || unitAmount > 1_000_000) {
      return NextResponse.json({ error: "Importo pagamento non valido" }, { status: 400 });
    }

    const baseUrl = getBaseUrl(request);
    const successUrl = `${baseUrl}/t/${encodeURIComponent(tenant.slug)}/success?session_id={CHECKOUT_SESSION_ID}&app_id=${encodeURIComponent(appointment.id)}`;
    const cancelUrl = `${baseUrl}/t/${encodeURIComponent(tenant.slug)}?canceled=true`;
    const applicationFee = unitAmount >= 500 ? Math.min(100, unitAmount - 1) : 0;

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        metadata: {
          type: "appointment_deposit",
          appointmentId: appointment.id,
          tenantSlug: tenant.slug,
        },
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: `Prenotazione: ${appointment.service.name}` },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        payment_intent_data: applicationFee
          ? { application_fee_amount: applicationFee }
          : undefined,
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      { stripeAccount: stripeAccountId }
    );

    if (!session.url) {
      return NextResponse.json({ error: "Checkout Stripe non disponibile" }, { status: 502 });
    }

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { stripeSession: session.id, paymentStatus: "PENDING" },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "Pagamento temporaneamente non disponibile. Riprova più tardi." },
      { status: 500 }
    );
  }
}
