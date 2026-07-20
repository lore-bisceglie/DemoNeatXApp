import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { isTenantAdminCookieValid } from "@/lib/auth";
import { cookies } from "next/headers";

export const maxDuration = 60; // 60 seconds max

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, imageBase64 } = body;

    if (!slug || !imageBase64) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const authCookie = cookieStore.get('admin_auth_' + slug)?.value;
    if (!isTenantAdminCookieValid(authCookie, slug)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Convert base64 data URL to raw base64 string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const { object } = await generateObject({
      model: google('models/gemini-1.5-flash'),
      schema: z.object({
        captions: z.array(z.string()).length(3).describe("3 diverse Instagram captions. Use emojis, hashtags, and a clear call to action to book an appointment via the link in bio."),
      }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "You are an expert Social Media Manager for a hair salon / barber shop. Look at this photo and write 3 highly engaging Instagram captions for it. Keep them professional but trendy. Always include a Call To Action to book an appointment." },
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
