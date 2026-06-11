import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "ID mancante" }, { status: 400 });
  }

  try {
    const services = await prisma.service.findMany({
      where: { tenantId: tenantId }
    });
    
    return NextResponse.json({ services });
  } catch (error) {
    return NextResponse.json({ error: "Errore di connessione" }, { status: 500 });
  }
}