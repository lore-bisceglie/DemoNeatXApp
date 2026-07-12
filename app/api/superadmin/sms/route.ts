import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;

  try {
    const { tenantId, amount, locationId } = await req.json();

    if (!tenantId || !amount || isNaN(amount)) {
      return NextResponse.json({ error: "Dati mancanti o invalidi" }, { status: 400 });
    }

    const creditsToAdd = parseInt(amount, 10);

    if (locationId) {
      const ls = await prisma.locationSettings.upsert({
        where: { locationId },
        create: { locationId, smsCredits: creditsToAdd },
        update: { smsCredits: { increment: creditsToAdd } },
      });
      return NextResponse.json({ success: true, newTotal: ls.smsCredits, locationId });
    }

    const storeSettings = await prisma.storeSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        smsCredits: creditsToAdd,
      },
      update: {
        smsCredits: { increment: creditsToAdd },
      },
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
