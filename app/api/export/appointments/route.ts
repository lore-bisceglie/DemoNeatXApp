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

  const appointments = await prisma.appointment.findMany({
    orderBy: [
      { date: "asc" },
      { time: "asc" },
    ],
  });

  const rows = [
    csvLine([
      "Data",
      "Ora",
      "Cliente",
      "Telefono",
      "Servizio",
      "Prezzo",
      "Origine",
      "Pagato",
      "Creato Il",
    ]),
    ...appointments.map((appointment) => {
      const service = getDemoServiceForTime(appointment.time);
      return csvLine([
        appointment.date,
        appointment.time,
        appointment.customerName,
        appointment.customerPhone,
        service.name,
        service.price,
        appointment.source,
        appointment.isPaid ? "si" : "no",
        appointment.createdAt.toISOString(),
      ]);
    }),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="appuntamenti-mito.csv"',
    },
  });
}
