import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { csvLine } from "@/lib/csv";
import { getDemoServiceForTime } from "@/lib/demoService";
import {
  hasValidAuthCookieHeader,
  hasValidAuthCookie,
  loginRedirectUrl,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();

  if (
    !hasValidAuthCookie(cookieStore) &&
    !hasValidAuthCookieHeader(request.headers.get("cookie"))
  ) {
    return NextResponse.redirect(loginRedirectUrl(request.url));
  }

  const [appointments, notes, noShows] = await Promise.all([
    prisma.appointment.findMany({
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.customerNote.findMany(),
    prisma.noShow.findMany(),
  ]);

  const customers = new Map<
    string,
    {
      name: string;
      phone: string;
      visits: number;
      totalSpent: number;
      lastDate: string;
      noShows: number;
      note: string;
      preference: string;
    }
  >();

  appointments
    .filter(
      (appointment) =>
        !appointment.customerName.includes("PAUSA") &&
        !appointment.customerName.includes("FERIE")
    )
    .forEach((appointment) => {
      const current =
        customers.get(appointment.customerPhone) ||
        {
          name: appointment.customerName,
          phone: appointment.customerPhone,
          visits: 0,
          totalSpent: 0,
          lastDate: "",
          noShows: 0,
          note: "",
          preference: "",
        };

      current.name = appointment.customerName || current.name;
      current.visits += 1;
      current.totalSpent += getDemoServiceForTime(appointment.time).price;
      if (!current.lastDate || appointment.date > current.lastDate) {
        current.lastDate = appointment.date;
      }

      customers.set(appointment.customerPhone, current);
    });

  noShows.forEach((item) => {
    const current =
      customers.get(item.customerPhone) ||
      {
        name: item.customerName || "",
        phone: item.customerPhone,
        visits: 0,
        totalSpent: 0,
        lastDate: "",
        noShows: 0,
        note: "",
        preference: "",
      };

    current.noShows += 1;
    customers.set(item.customerPhone, current);
  });

  notes.forEach((note) => {
    const current =
      customers.get(note.phone) ||
      {
        name: note.customerName || "",
        phone: note.phone,
        visits: 0,
        totalSpent: 0,
        lastDate: "",
        noShows: 0,
        note: "",
        preference: "",
      };

    current.note = note.note || "";
    current.preference = note.preference || "";
    current.name = note.customerName || current.name;
    customers.set(note.phone, current);
  });

  const rows = [
    csvLine([
      "Cliente",
      "Telefono",
      "Visite",
      "Totale stimato",
      "Ultimo appuntamento",
      "No-show",
      "Note",
      "Preferenze",
    ]),
    ...Array.from(customers.values()).map((customer) =>
      csvLine([
        customer.name,
        customer.phone,
        customer.visits,
        customer.totalSpent,
        customer.lastDate,
        customer.noShows,
        customer.note,
        customer.preference,
      ])
    ),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clienti-mito.csv"',
    },
  });
}
