import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";

export async function POST(request: Request) {
  try {
    const rate = await checkRequestRateLimit(request, "demo-visit", 3, 60 * 60);
    if (!rate.success) return NextResponse.json({ success: true });

    const userAgent = request.headers.get("user-agent") || "Sconosciuto";
    const device = /mobile|android|iphone/i.test(userAgent) ? "📱 Mobile" : "💻 Desktop";
    const text =
      "👀 <b>VISITA ALLA DEMO</b> 👀\n\n" +
      "Qualcuno sta provando la Demo Pubblica (Vetrina)!\n" +
      `<b>Dispositivo:</b> ${device}`;

    await sendTelegramMessage(text);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Demo visit endpoint error:", error);
    return NextResponse.json({ success: true });
  }
}
