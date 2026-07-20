import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const maxDuration = 60; // Max execution time 60 seconds

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop", // Barbershop chair
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop", // Barber cutting hair
  "https://images.unsplash.com/photo-1512496015851-a1c848529cb6?q=80&w=1200&auto=format&fit=crop", // Razor / Tools
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1200&auto=format&fit=crop", // Salon setup
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1200&auto=format&fit=crop", // Barber at work
  "https://images.unsplash.com/photo-1534062828696-6d63493b8d03?q=80&w=1200&auto=format&fit=crop", // Barber tools
  "https://images.unsplash.com/photo-1622286345638-ebcb319d30da?q=80&w=1200&auto=format&fit=crop"  // Shop window
];

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    
    // Autenticazione: Vercel Cron invia un Bearer token
    // Oppure permettiamo un token via query parameter per testing manuale
    const url = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET;
    
    if (
      authHeader !== `Bearer ${cronSecret}` && 
      url.searchParams.get("key") !== cronSecret
    ) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // 1. Scegliamo un'immagine a caso e applichiamo il watermark tramite OG Image
    const randomImage = STOCK_IMAGES[Math.floor(Math.random() * STOCK_IMAGES.length)];
    const watermarkedImage = `https://demo-neatx-app.vercel.app/api/og/marketing?bg=${encodeURIComponent(randomImage)}`;

    // 2. Generiamo il copy per NeatX
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        caption: z.string().describe("Il testo persuasivo per il post Instagram. Max 3-4 paragrafi corti."),
      }),
      messages: [
        {
          role: "user",
          content: "Sei il Social Media Manager di 'NeatX', una startup italiana che vende un software gestionale (Agenda, Appuntamenti, Prenotazioni Online) per barbieri e parrucchieri. Scrivi un post coinvolgente per Instagram. Scegli un problema (es. tempo perso al telefono, clienti che non si presentano, gestione disordinata cartacea) e offri NeatX come soluzione per automatizzare il salone. Usa un tono dinamico, professionale ma giovane. DEVI ASSOLUTAMENTE aggiungere 5-8 hashtag in fondo al post, tra cui: #NeatX #AgendaBarbiere #BarbiereItalia #ParrucchiereItalia #GestioneSalone. Concludi sempre dicendo di cliccare il link in bio per provare gratis per 14 giorni.",
        },
      ],
    });

    const captionText = object.caption;

    // 3. Pubblichiamo su Instagram
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const token = process.env.META_PERMANENT_TOKEN;

    if (!igAccountId || !token) {
      throw new Error("Credenziali Instagram mancanti in .env");
    }

    // Step A: Crea il Media Container
    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?image_url=${encodeURIComponent(watermarkedImage)}&caption=${encodeURIComponent(captionText)}&access_token=${token}`, {
      method: "POST"
    });
    
    const mediaData = await mediaRes.json();
    if (mediaData.error) {
      console.error("IG Media Create Error:", mediaData.error);
      throw new Error("Errore creazione media su IG: " + mediaData.error.message);
    }
    
    const creationId = mediaData.id;

    // Step B: Pubblica il Container
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish?creation_id=${creationId}&access_token=${token}`, {
      method: "POST"
    });

    const publishData = await publishRes.json();
    if (publishData.error) {
      console.error("IG Publish Error:", publishData.error);
      throw new Error("Errore pubblicazione su IG: " + publishData.error.message);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Post di marketing pubblicato con successo!",
      ig_post_id: publishData.id,
      image_used: randomImage,
      caption: captionText
    });

  } catch (error: any) {
    console.error("Marketing Cron Error:", error);
    return NextResponse.json({ error: error.message || "Errore interno" }, { status: 500 });
  }
}
