import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { isTenantAdminCookieValid } from "@/lib/auth";

export async function GET() {
  try {
    const reviews = await prisma.platformReview.findMany({
      where: { isApproved: true },
      include: {
        tenant: {
          select: {
            name: true,
            city: true,
            ownerName: true,
            logoUrl: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(reviews);
  } catch (_e) {
    return NextResponse.json({ error: "Errore fetching reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, rating, text } = body;
    
    if (!slug || !rating || !text) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return NextResponse.json({ error: "Tenant non trovato" }, { status: 404 });
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('admin_auth_' + slug)?.value;
    if (!isTenantAdminCookieValid(authCookie, slug, tenant.sessionVersion)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const review = await prisma.platformReview.upsert({
      where: { tenantId: tenant.id },
      update: { rating, text },
      create: {
        tenantId: tenant.id,
        rating,
        text
      }
    });

    return NextResponse.json(review);
  } catch (_e) {
    return NextResponse.json({ error: "Errore salvataggio review" }, { status: 500 });
  }
}
