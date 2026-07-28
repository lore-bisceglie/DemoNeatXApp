import { NextResponse } from "next/server";
import {
  AvailabilityError,
  getAvailabilityForDate,
} from "@/lib/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const result = await getAvailabilityForDate({
      date: searchParams.get("date") || "",
      tenantId: searchParams.get("tenantId") || "",
      locationId: searchParams.get("locationId"),
      serviceId: searchParams.get("serviceId") || "",
      staffId: searchParams.get("staffId"),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AvailabilityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Errore Availability:", error);
    return NextResponse.json({ error: "Errore di connessione" }, { status: 500 });
  }
}
