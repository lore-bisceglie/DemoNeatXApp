import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId");

  if (!staffId) {
    return NextResponse.json({ error: "Manca staffId" }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { baseSchedule: true, shiftExceptions: true, name: true },
  });

  if (!staff) {
    return NextResponse.json({ error: "Staff non trovato" }, { status: 404 });
  }

  return NextResponse.json({
    baseSchedule: JSON.parse(staff.baseSchedule || "{}"),
    shiftExceptions: JSON.parse(staff.shiftExceptions || "[]"),
    name: staff.name,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { staffId, baseSchedule } = body;

  if (!staffId || !baseSchedule) {
    return NextResponse.json({ error: "Mancano staffId o baseSchedule" }, { status: 400 });
  }

  const staff = await prisma.staff.update({
    where: { id: staffId },
    data: { baseSchedule: JSON.stringify(baseSchedule) },
  });

  return NextResponse.json({ success: true, baseSchedule: JSON.parse(staff.baseSchedule || "{}") });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { staffId, exceptions } = body;

  if (!staffId || !Array.isArray(exceptions)) {
    return NextResponse.json({ error: "Mancano staffId o exceptions array" }, { status: 400 });
  }

  const staff = await prisma.staff.update({
    where: { id: staffId },
    data: { shiftExceptions: JSON.stringify(exceptions) },
  });

  return NextResponse.json({ success: true, shiftExceptions: JSON.parse(staff.shiftExceptions || "[]") });
}
