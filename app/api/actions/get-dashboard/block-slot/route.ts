import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";

const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";

function timeToMins(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export async function POST(req: Request) {
  try {
    const rate = await checkRequestRateLimit(req, "demo-block-slot", 20, 60 * 60);
    if (!rate.success) return NextResponse.json({ error: "Riprova più tardi" }, { status: 429 });
    const formData = await req.formData();

    const date = formData.get("date") as string;
    const time =
      (formData.get("time") as string) ||
      (formData.get("startTime") as string);

    const endTime = formData.get("endTime") as string | null;

    if (!date || !time) {
      return NextResponse.redirect(
        new URL("/dashboard?error=missing_params", req.url)
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: DEMO_TENANT_ID },
    });

    if (!tenant) {
      return NextResponse.redirect(
        new URL("/dashboard?error=no_tenant", req.url)
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        date,
        tenantId: tenant.id,
      },
      include: {
        service: true,
      },
    });

    const pauseStart = timeToMins(time);
    const pauseEnd = endTime ? timeToMins(endTime) : pauseStart + 15;

    if (pauseEnd <= pauseStart) {
      return NextResponse.redirect(
        new URL("/dashboard?error=invalid_time_range", req.url)
      );
    }

    let isOverlapping = false;

    for (const app of appointments) {
      if (app.time === "ALL_DAY") continue;

      const appStart = timeToMins(app.time);

      let appDuration = 15;

      if (app.endTime) {
        appDuration = timeToMins(app.endTime) - appStart;
      } else if (app.service?.duration) {
        appDuration = app.service.duration;
      }

      const appEnd = appStart + appDuration;

      if (pauseStart < appEnd && pauseEnd > appStart) {
        isOverlapping = true;
        break;
      }
    }

    if (isOverlapping) {
      return NextResponse.redirect(
        new URL("/dashboard?error=overlap", req.url)
      );
    }

    await prisma.appointment.create({
      data: {
        customerName: "☕ PAUSA",
        customerPhone: "0000000000",
        date,
        time,
        endTime: endTime || null,
        tenantId: tenant.id,
        cancelToken: crypto.randomUUID(),
      },
    });

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("Errore blocco orario:", error);

    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    );
  }
}
