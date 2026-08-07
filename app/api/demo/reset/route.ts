import { NextResponse } from "next/server";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";
import { resetDemoData } from "@/lib/demo-seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rate = await checkRequestRateLimit(request, "demo-reset", 5, 60 * 60);
    if (!rate.success) {
      return NextResponse.json({ error: "Riprova più tardi" }, { status: 429 });
    }

    const result = await resetDemoData();

    return NextResponse.json({
      ok: true,
      dates: result.dates,
      appointments: result.appointments,
    });
  } catch (error) {
    console.error("Errore reset demo:", error);
    return NextResponse.json(
      { error: "Impossibile ripristinare la demo." },
      { status: 500 }
    );
  }
}
