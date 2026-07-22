import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { isTenantAdminCookieValid } from "@/lib/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; // 60 seconds max

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, imageBase64 } = body;

    if (!slug || !imageBase64) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('admin_auth_' + slug)?.value;
    if (!isTenantAdminCookieValid(authCookie, slug, tenant.sessionVersion)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Convert base64 data URL to raw base64 string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const salonName = tenant.name || "il nostro salone";
    const customHashtag = `#${salonName.replace(/\s+/g, '')}`;

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        captions: z.array(z.string()).length(3).describe("3 caption diverse per Instagram. Usa emoji, hashtag in italiano e una chiara call to action per far prenotare tramite il link in bio."),
      }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Sei un Social Media Manager esperto per un salone di barbieri / parrucchieri in Italia chiamato "${salonName}". Guarda questa foto e scrivi 3 caption per Instagram molto coinvolgenti. Usa un tono professionale ma trendy. Includi sempre una Call To Action per prenotare un appuntamento tramite il link in bio. Scrivi ESCLUSIVAMENTE in lingua Italiana. IMPORTANTISSIMO: Includi SEMPRE l'hashtag personalizzato del salone ${customHashtag} alla fine del post, insieme ad altri hashtag rilevanti per attirare clienti locali.` },
            { type: "image", image: base64Data },
          ],
        },
      ],
    });

    return NextResponse.json({ captions: object.captions });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate captions" }, { status: 500 });
  }
}
