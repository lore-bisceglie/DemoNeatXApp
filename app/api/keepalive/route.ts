import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.appointment.findFirst({
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      status: "DemoNeatX DB Awake",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "Database Wakeup Failed",
        error: String(error),
      },
      { status: 500 }
    );
  }
}