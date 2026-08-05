import { NextResponse } from "next/server";
export async function PUT() {
  return NextResponse.json({ error: "Il collegamento Google Sheets è stato ritirato. Gestisci i turni dal Team." }, { status: 410 });
}
