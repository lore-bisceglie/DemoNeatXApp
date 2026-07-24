import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await props.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: true,
      tenant: true,
      location: true,
    },
  });

  if (!appointment || !appointment.service) {
    return new NextResponse("Appointment not found", { status: 404 });
  }

  // Determina l'offset UTC di Europe/Rome per la data specifica
  function getRomeUtcOffset(dateStr: string, timeStr: string): number {
    const trialDate = new Date(`${dateStr}T12:00:00`);
    const tzName = new Intl.DateTimeFormat("en", {
      timeZone: "Europe/Rome",
      timeZoneName: "short",
    })
      .formatToParts(trialDate)
      .find((p) => p.type === "timeZoneName")?.value;
    return tzName === "CEST" ? 120 : 60; // CEST = UTC+2, CET = UTC+1
  }

  const romeOffset = getRomeUtcOffset(appointment.date, appointment.time);
  const [h, m] = appointment.time.split(":").map(Number);
  const [y, mo, d] = appointment.date.split("-").map(Number);

  // Converti ora Rome in UTC sottraendo l'offset (CEST=+120, CET=+60 minuti)
  const startUtc = new Date(Date.UTC(y, mo - 1, d, h, m - romeOffset, 0));
  const endUtc = new Date(startUtc.getTime() + appointment.service.duration * 60000);

  // Formato YYYYMMDDTHHMMSSZ (sempre UTC)
  const formatCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const text = `Appuntamento: ${appointment.service.name}`;
  const locationStr =
    appointment.location?.address || appointment.tenant?.address || "";
  const details = `Prenotazione confermata presso ${
    appointment.tenant?.name || "il salone"
  }.`;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NeatX//Prenotazioni//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${formatCalDate(startUtc)}`,
    `DTEND:${formatCalDate(endUtc)}`,
    `SUMMARY:${text}`,
    `DESCRIPTION:${details.replace(/,/g, "\\,")}`,
    `LOCATION:${locationStr.replace(/,/g, "\\,")}`,
    `STATUS:CONFIRMED`,
    `BEGIN:VALARM`,
    `TRIGGER:-PT1H`,
    `ACTION:DISPLAY`,
    `DESCRIPTION:Promemoria appuntamento tra 1 ora`,
    `END:VALARM`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="appuntamento-${appointment.date}.ics"`,
    },
  });
}
