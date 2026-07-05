import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  addMinutes,
  dateFromOffset,
  getDemoShopTemplate,
  sanitizeSlug,
} from "@/lib/demoShopTemplates";
import { getTenantAdminUrl, getTenantPublicUrl } from "@/lib/domains";
import { hashPassword } from "@/lib/password";

function cleanPhone(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\D/g, "");
  return cleaned.length >= 8 ? cleaned : null;
}

function cleanText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

async function uniqueSlug(base: string) {
  const root = sanitizeSlug(base);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Math.random().toString(36).substring(2, 6);
    const slug = `${root}-${suffix}`;
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (!existing) return slug;
  }

  return `${root}-${Date.now().toString(36)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const businessName = cleanText(body.businessName || body.name);
    const category = cleanText(body.category || body.template, "barber");
    const city = cleanText(body.city);
    const ownerName = cleanText(body.ownerName);
    const ownerEmail = cleanText(body.ownerEmail || body.email).toLowerCase();
    const password = cleanText(body.password);
    const phone = cleanPhone(body.phone);

    if (!businessName || !category || !city || !ownerName || !ownerEmail || !password) {
      return NextResponse.json(
        { error: "Inserisci nome attivita, categoria, citta, nome, email e password." },
        { status: 400 }
      );
    }

    if (!ownerEmail.includes("@") || !ownerEmail.includes(".")) {
      return NextResponse.json({ error: "Inserisci una email valida." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La password deve avere almeno 8 caratteri." }, { status: 400 });
    }

    const existingAccount = await prisma.tenant.findFirst({
      where: { ownerEmail },
      select: { slug: true },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: "Esiste gia un account con questa email. Accedi dalla pagina login." },
        { status: 409 }
      );
    }

    const template = getDemoShopTemplate(category);
    const slug = await uniqueSlug(`${businessName}-${city}`);
    const adminPassword = `${sanitizeSlug(ownerName).slice(0, 4) || "demo"}${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const now = new Date();

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const tenant = await prisma.tenant.create({
      data: {
        name: businessName,
        slug,
        category: template.id,
        city,
        ownerName,
        ownerEmail,
        ownerPasswordHash: hashPassword(password),
        description: `${template.description} Demo generata automaticamente: modifica tutto quando vuoi e pubblicala senza ricominciare.`,
        phone,
        address: city,
        openTime: template.openTime,
        closeTime: template.closeTime,
        breakStart: template.breakStart || null,
        breakEnd: template.breakEnd || null,
        closedDays: JSON.stringify(template.closedDays),
        adminPassword,
        trialStartedAt: now,
        trialEndsAt,
        trialStatus: "trial_active",
        isDemoData: true,
        plan: "basic",
        services: {
          create: template.services.map((service) => ({
            name: service.name,
            duration: service.duration,
            price: service.price,
          })),
        },
        storeSettings: {
          create: {
            smsCredits: 25,
            maxConcurrentAppointments: Math.max(1, template.staff.length),
          },
        },
      },
      include: { services: true },
    });

    const serviceByName = new Map(tenant.services.map((service) => [service.name, service]));
    const staffByName = new Map<string, { id: string; name: string }>();

    for (const member of template.staff) {
      const allowedServices = member.services?.length
        ? member.services
            .map((serviceName) => serviceByName.get(serviceName))
            .filter(Boolean)
        : tenant.services;

      const staff = await prisma.staff.create({
        data: {
          name: member.name,
          tenantId: tenant.id,
          services: {
            connect: allowedServices.map((service) => ({ id: service!.id })),
          },
        },
      });
      staffByName.set(member.name, staff);
    }

    for (const seed of template.bookings) {
      const service = serviceByName.get(seed.serviceName) || tenant.services[0];
      if (!service) continue;

      const staff = seed.staffName ? staffByName.get(seed.staffName) : undefined;
      const date = dateFromOffset(seed.dayOffset, template.closedDays);

      await prisma.appointment.create({
        data: {
          customerName: seed.customerName,
          customerPhone: seed.customerPhone,
          date,
          time: seed.time,
          endTime: addMinutes(seed.time, service.duration || 30),
          source: "DEMO",
          isPaid: Boolean(seed.isPaid),
          tenantId: tenant.id,
          serviceId: service.id,
          staffId: staff?.id,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        action: "CREATE_DEMO_SHOP",
        actor: "system",
        message: `Negozio demo creato per ${businessName}: servizi, staff e prenotazioni sono gia pronti.`,
        metadata: JSON.stringify({ category: template.id, ownerEmail }),
      },
    });

    return NextResponse.json({
      success: true,
      slug: tenant.slug,
      publicUrl: getTenantPublicUrl(tenant.slug),
      adminUrl: getTenantAdminUrl(tenant.slug),
    });
  } catch (error) {
    console.error("Errore Onboarding:", error);
    return NextResponse.json({ error: "Errore interno durante la creazione." }, { status: 500 });
  }
}
