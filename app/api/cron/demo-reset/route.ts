import { NextResponse } from "next/server";
import { resetDemoData } from "@/lib/demo-seed";

export const dynamic = "force-dynamic";

function authorize(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Ripristino automatico giornaliero dei dati finti della demo.
// La demo è aperta a tutti: chiunque può sporcare i dati, quindi ogni giorno
// ricreiamo appuntamenti, waitlist, no-show e note clienti demo.
export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const result = await resetDemoData();
    return NextResponse.json({
      success: true,
      dates: result.dates,
      appointments: result.appointments,
    });
  } catch (error) {
    console.error("Errore reset demo cron:", error);
    return NextResponse.json({ error: "Impossibile ripristinare la demo." }, { status: 500 });
  }
}
