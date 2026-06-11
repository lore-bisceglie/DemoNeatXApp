import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  
  if (date && time) {
    await prisma.appointment.create({
      data: { customerName: "☕ PAUSA", customerPhone: "0000000000", date, time }
    });
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
}