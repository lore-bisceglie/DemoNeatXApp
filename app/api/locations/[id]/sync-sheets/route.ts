import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: "La sincronizzazione Google Sheets è stata ritirata. Usa Team per impostare i turni." }, { status: 410 });
}
