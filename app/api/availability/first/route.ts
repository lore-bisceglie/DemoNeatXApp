import { NextResponse } from "next/server";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";
import {
  AvailabilityError,
  findFirstAvailability,
} from "@/lib/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const tenantId = searchParams.get("tenantId") || "";
    const serviceId = searchParams.get("serviceId") || "";
    const locationId = searchParams.get("locationId");
    const staffId = searchParams.get("staffId");

    if (!tenantId || !serviceId) {
      return NextResponse.json(
        { error: "Mancano parametri essenziali" },
        { status: 400 },
      );
    }

    const rate = await checkRequestRateLimit(
      request,
      "availability-first",
      15,
      60,
      tenantId,
    );
    if (!rate.success) {
      return NextResponse.json(
        { error: "Troppe ricerche ravvicinate. Riprova tra poco." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }

    const result = await findFirstAvailability({
      tenantId,
      serviceId,
      locationId,
      staffId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AvailabilityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Errore ricerca primo posto:", error);
    return NextResponse.json({ error: "Errore di connessione" }, { status: 500 });
  }
}
