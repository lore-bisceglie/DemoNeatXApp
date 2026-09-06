import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function POST(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;

  try {
    const { tenantId, amount } = await req.json();

    if (!tenantId || !amount || isNaN(amount)) {
      return NextResponse.json({ error: "Dati mancanti o invalidi" }, { status: 400 });
    }

    const creditsToAdd = parseInt(amount, 10);

    const storeSettings = await prisma.storeSettings.upsert({
      where: { tenantId },
      create: { tenantId, smsCredits: creditsToAdd },
      update: { smsCredits: { increment: creditsToAdd } },
    });

    await logActivity({
      tenantId,
      actor: "superadmin",
      action: "sms_credits_updated",
      message: `${creditsToAdd > 0 ? "Aggiunti" : "Rimossi"} ${Math.abs(creditsToAdd)} crediti SMS dal Super Admin.`,
      metadata: { amount: creditsToAdd, total: storeSettings.smsCredits },
    });

    return NextResponse.json({ 
      success: true, 
      newTotal: storeSettings.smsCredits 
    });

  } catch (error) {
    console.error("Errore Superadmin SMS:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
