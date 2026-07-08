import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { activationRequested: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error requesting activation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
