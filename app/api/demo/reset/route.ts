import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";

export const dynamic = "force-dynamic";

const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";

const toIsoDate = (date: Date) => date.toISOString().split("T")[0];

const addMinutes = (time: string, minutesToAdd: number) => {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(total / 60).toString().padStart(2, "0");
  const nextMinutes = (total % 60).toString().padStart(2, "0");
  return `${nextHours}:${nextMinutes}`;
};

const getVisibleWeekDates = () => {
  const refDate = new Date();
  refDate.setHours(12, 0, 0, 0);

  if (refDate.getDay() === 0) {
    refDate.setDate(refDate.getDate() + 2);
  }

  if (refDate.getDay() === 1) {
    refDate.setDate(refDate.getDate() + 1);
  }

  if (refDate.getDay() === 6) {
    refDate.setDate(refDate.getDate() + 3);
  }

  const diffToTue = 2 - refDate.getDay();
  const tuesday = new Date(refDate);
  tuesday.setDate(refDate.getDate() + diffToTue);

  return Array.from({ length: 5 }).map((_, index) => {
    const date = new Date(tuesday);
    date.setDate(tuesday.getDate() + index);
    return toIsoDate(date);
  });
};

export async function POST(request: Request) {
  try {
    const rate = await checkRequestRateLimit(request, "demo-reset", 5, 60 * 60);
    if (!rate.success) {
      return NextResponse.json({ error: "Riprova più tardi" }, { status: 429 });
    }
    const services = await prisma.service.findMany({
      where: {
        tenantId: DEMO_TENANT_ID,
      },
    });

    if (services.length === 0) {
      return NextResponse.json(
        { error: "Nessun servizio demo configurato." },
        { status: 400 }
      );
    }

    const weekDates = getVisibleWeekDates();
    const d0 = weekDates[0]!;
    const d1 = weekDates[1]!;
    const d2 = weekDates[2]!;
    const d3 = weekDates[3]!;
    const d4 = weekDates[4]!;

    const serviceByKeyword = (keyword: string) =>
      services.find((service) =>
        service.name.toLowerCase().includes(keyword.toLowerCase())
      ) || services[0];

    const appointmentSeeds = [
      {
        date: d0,
        time: "09:30",
        name: "Marco Demo",
        phone: "3451112233",
        keyword: "Barbiere",
        isPaid: false,
      },
      {
        date: d0,
        time: "10:30",
        name: "Giulia Nails",
        phone: "3331234567",
        keyword: "Nails",
        isPaid: true,
      },
      {
        date: d1,
        time: "11:00",
        name: "Sara Beauty",
        phone: "3471122334",
        keyword: "Beauty",
        isPaid: true,
      },
      {
        date: d1,
        time: "15:00",
        name: "Andrea Fisio",
        phone: "3465557788",
        keyword: "Fisioterapia",
        isPaid: false,
      },
      {
        date: d2,
        time: "10:00",
        name: "Cliente Studio",
        phone: "3402228899",
        keyword: "Studio privato",
        isPaid: true,
      },
      {
        date: d2,
        time: "16:15",
        name: "Luca Ink",
        phone: "3497788990",
        keyword: "Tattoo",
        isPaid: false,
      },
      {
        date: d3,
        time: "09:45",
        name: "Elena Relax",
        phone: "3485551122",
        keyword: "Massaggi",
        isPaid: true,
      },
      {
        date: d3,
        time: "12:30",
        name: "Francesca Piega",
        phone: "3519988776",
        keyword: "Parrucchiere",
        isPaid: false,
      },
    ];

    const appointments = appointmentSeeds.map((seed) => {
      const service = serviceByKeyword(seed.keyword);
      const duration = service.duration || 30;

      return {
        customerName: seed.name,
        customerPhone: seed.phone,
        date: seed.date,
        time: seed.time,
        endTime: addMinutes(seed.time, duration),
        cancelToken: randomUUID(),
        source: "ONLINE",
        isPaid: seed.isPaid,
        serviceId: service.id,
        tenantId: DEMO_TENANT_ID,
      };
    });

    await prisma.$transaction([
      prisma.appointment.deleteMany({
        where: {
          tenantId: DEMO_TENANT_ID,
        },
      }),
      prisma.waitlist.deleteMany({
        where: {
          tenantId: DEMO_TENANT_ID,
        },
      }),
      prisma.noShow.deleteMany({
        where: {
          tenantId: DEMO_TENANT_ID,
        },
      }),
      prisma.customerNote.deleteMany({
        where: {
          tenantId: DEMO_TENANT_ID,
        },
      }),
      prisma.storeSettings.upsert({
        where: {
          tenantId: DEMO_TENANT_ID,
        },
        update: {
          smsCredits: 50,
        },
        create: {
          tenantId: DEMO_TENANT_ID,
          smsCredits: 50,
        },
      }),
      prisma.appointment.createMany({
        data: [
          ...appointments,
          {
            customerName: "☕ PAUSA",
            customerPhone: "0000000000",
            date: d1,
            time: "13:00",
            endTime: "13:30",
            cancelToken: randomUUID(),
            source: "WALK_IN",
            isPaid: false,
            tenantId: DEMO_TENANT_ID,
          },
          {
            customerName: "🌴 FERIE",
            customerPhone: "0000000000",
            date: d4,
            time: "ALL_DAY",
            cancelToken: randomUUID(),
            source: "WALK_IN",
            isPaid: false,
            tenantId: DEMO_TENANT_ID,
          },
        ],
      }),
      prisma.waitlist.createMany({
        data: [
          {
            name: "Martina Lista",
            phone: "3334445566",
            date: d0,
            tenantId: DEMO_TENANT_ID,
          },
          {
            name: "Davide Urgente",
            phone: "3470001122",
            date: d2,
            tenantId: DEMO_TENANT_ID,
          },
        ],
      }),
      prisma.noShow.createMany({
        data: [
          {
            customerName: "Cliente Assente Demo",
            customerPhone: "3339990000",
            date: d0,
            tenantId: DEMO_TENANT_ID,
          },
        ],
      }),
      prisma.customerNote.createMany({
        data: [
          {
            customerName: "Giulia Nails",
            phone: "3331234567",
            note: "Preferisce ultimo appuntamento della mattina.",
            preference: "Promemoria WhatsApp il giorno prima.",
            tenantId: DEMO_TENANT_ID,
          },
          {
            customerName: "Luca Ink",
            phone: "3497788990",
            note: "Porta riferimento immagine e vuole consulenza rapida.",
            preference: "Chiedere conferma 24 ore prima.",
            tenantId: DEMO_TENANT_ID,
          },
        ],
      }),
    ]);

    return NextResponse.json({
      ok: true,
      dates: weekDates,
      appointments: appointments.length + 2,
    });
  } catch (error) {
    console.error("Errore reset demo:", error);
    return NextResponse.json(
      { error: "Impossibile ripristinare la demo." },
      { status: 500 }
    );
  }
}
