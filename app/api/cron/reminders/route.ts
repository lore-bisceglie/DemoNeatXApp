import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

export const dynamic = "force-dynamic";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json(
        { error: "Accesso negato" },
        { status: 401 }
      );
    }

    if (!accountSid || !authToken || !fromPhone) {
      return NextResponse.json(
        { error: "Configurazione Twilio mancante nel file .env" },
        { status: 500 }
      );
    }

    const tenant = await prisma.tenant.findFirst();

    if (!tenant) {
      return NextResponse.json(
        { error: "Nessun salone configurato" },
        { status: 400 }
      );
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateFormatter = new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = dateFormatter.formatToParts(tomorrow);
    const day = parts.find((p) => p.type === "day")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const year = parts.find((p) => p.type === "year")?.value;

    const tomorrowString = `${year}-${month}-${day}`;
    const italianDate = `${day}/${month}/${year}`;

    const appointments = await prisma.appointment.findMany({
      where: {
        date: tomorrowString,
        tenantId: tenant.id,
        customerPhone: {
          not: "0000000000",
        },
        customerName: {
          notIn: ["☕ PAUSA", "🌴 FERIE"],
        },
      },
      include: {
        service: true,
      },
    });

    if (appointments.length === 0) {
      return NextResponse.json({
        message: "Nessun appuntamento domani. Nessun SMS inviato.",
      });
    }

    let settings = await prisma.storeSettings.findUnique({
      where: {
        tenantId: tenant.id,
      },
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          tenantId: tenant.id,
          smsCredits: 50,
        },
      });
    }

    let creditiRimanenti = settings.smsCredits || 0;
    let messaggiInviati = 0;

    if (creditiRimanenti <= 0) {
      return NextResponse.json(
        { error: "Crediti SMS esauriti" },
        { status: 400 }
      );
    }

    const client = twilio(accountSid, authToken);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://demo-neatx-app.vercel.app"
        : "http://localhost:3000");

    for (const app of appointments) {
      if (creditiRimanenti <= 0) break;

      const rawPhone = app.customerPhone.replace(/\D/g, "");
      const finalPhone = rawPhone.startsWith("39")
        ? `+${rawPhone}`
        : `+39${rawPhone}`;

      const cancelUrl = `${appUrl}/cancel/${app.cancelToken}`;

      const serviceText = app.service?.name
        ? `\nServizio: ${app.service.name}`
        : "";

      const messageBody =
        `Demo NeatX 🚀\n` +
        `Ciao ${app.customerName}, ti ricordiamo il tuo appuntamento per DOMANI (${italianDate}) alle ore ${app.time}.` +
        `${serviceText}\n\n` +
        `Se non puoi venire, annulla qui:\n${cancelUrl}`;

      try {
        await client.messages.create({
          body: messageBody,
          from: fromPhone,
          to: finalPhone,
        });

        creditiRimanenti--;
        messaggiInviati++;
      } catch (smsError) {
        console.error(`Errore invio SMS a ${finalPhone}:`, smsError);
      }
    }

    await prisma.storeSettings.update({
      where: {
        id: settings.id,
      },
      data: {
        smsCredits: creditiRimanenti,
      },
    });

    return NextResponse.json({
      success: true,
      messaggiInviati,
      creditiRimanenti,
    });
  } catch (error) {
    console.error("Errore nel Cron Job:", error);

    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}