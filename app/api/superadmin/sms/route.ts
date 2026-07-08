import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { tenantId, amount } = await req.json();

    if (!tenantId || !amount || isNaN(amount)) {
      return NextResponse.json({ error: "Dati mancanti o invalidi" }, { status: 400 });
    }

    const creditsToAdd = parseInt(amount, 10);

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
