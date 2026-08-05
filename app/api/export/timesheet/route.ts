import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const destination = new URL("/api/export/timesheets", request.url);
  if (tenantId) destination.searchParams.set("tenantId", tenantId);
  const month = searchParams.get("month");
  if (month) destination.searchParams.set("month", month);
  return NextResponse.redirect(destination, 307);
}
