import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { selectDailyMarketingAsset } from "@/lib/marketing-rotation";

export const maxDuration = 60; // Max execution time 60 seconds

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

    // 0. Ruotiamo categoria e immagine senza ripetizioni nelle sedici pubblicazioni successive.
    const asset = selectDailyMarketingAsset();

    // 1. Applichiamo il watermark NeatX all'immagine selezionata per oggi.
    const selectedImage = asset.image;
    const watermarkedImage = `https://demo-neatx-app.vercel.app/api/og/marketing?bg=${encodeURIComponent(selectedImage)}`;

    // 2. Generiamo il copy per NeatX
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        caption: z.string().describe("Il testo persuasivo per il post Instagram. Max 3-4 paragrafi corti."),
      }),
      messages: [
        {
          role: "user",
          content: `Sei il Social Media Manager di 'NeatX', una startup italiana che vende un software gestionale (Agenda, Appuntamenti, Prenotazioni Online) per il settore beauty e wellness.
          
OGGI DEVI RIVOLGERTI ESCLUSIVAMENTE A: ${asset.category}.

Scrivi un post coinvolgente per Instagram per convincere i professionisti di questo settore ad abbonarsi. Scegli un problema specifico del loro lavoro (es. appuntamenti sovrapposti, chiamate mentre stanno lavorando con le mani occupate, clienti che non si presentano all'appuntamento) e offri NeatX come la soluzione definitiva. Usa un tono dinamico, professionale ma giovane. DEVI ASSOLUTAMENTE aggiungere 5-8 hashtag in fondo al post, tra cui: ${asset.hashtags}. Concludi sempre dicendo di cliccare il link in bio per provare gratis per 14 giorni.`,
        },
      ],
    });

    const captionText = object.caption;

    // 3. Pubblichiamo su Instagram (Feed Post)
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const token = process.env.META_PERMANENT_TOKEN;

    if (!igAccountId || !token) {
      throw new Error("Credenziali Instagram mancanti in .env");
    }

    // --- PRE-WARM CACHE VERCEL OG ---
    // Questo previene che Facebook vada in timeout (Facebook aspetta max 5s)
    // Forziamo Vercel a generare l'immagine e a salvarla in cache CDN (max-age=31536000)
    console.log("Pre-warming OG image for Post...");
    await fetch(watermarkedImage).catch(() => {});

    // Step A: Crea il Media Container per il Post Feed
    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?image_url=${encodeURIComponent(watermarkedImage)}&caption=${encodeURIComponent(captionText)}&access_token=${token}`, {
      method: "POST"
    });
    
    const mediaData = await mediaRes.json();
    if (mediaData.error) {
      console.error("IG Media Create Error:", mediaData.error);
      throw new Error("Errore creazione media su IG: " + mediaData.error.message);
    }
    
    const creationId = mediaData.id;

    // Step B: Pubblica il Container Feed
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish?creation_id=${creationId}&access_token=${token}`, {
      method: "POST"
    });

    const publishData = await publishRes.json();
    if (publishData.error) {
      console.error("IG Publish Error:", publishData.error);
      throw new Error("Errore pubblicazione su IG: " + publishData.error.message);
    }

    // --- PUBBLICAZIONE STORIA ---
    const storyImage = `https://demo-neatx-app.vercel.app/api/og/story?bg=${encodeURIComponent(selectedImage)}`;
    let storyId = null;

    try {
      console.log("Pre-warming OG image for Story...");
      await fetch(storyImage).catch(() => {});

      // Step C: Crea Media Container per la Storia
      const storyMediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?image_url=${encodeURIComponent(storyImage)}&media_type=STORIES&access_token=${token}`, {
        method: "POST"
      });
      const storyMediaData = await storyMediaRes.json();
      
      if (storyMediaData.error) {
        console.error("IG Story Create Error:", storyMediaData.error);
      } else {
        // Step D: Pubblica la Storia
        const storyPublishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish?creation_id=${storyMediaData.id}&access_token=${token}`, {
          method: "POST"
        });
        const storyPublishData = await storyPublishRes.json();
        if (storyPublishData.id) {
          storyId = storyPublishData.id;
        } else {
          console.error("IG Story Publish Error:", storyPublishData.error);
        }
      }
    } catch (storyErr) {
      console.error("Errore generico durante pubblicazione storia:", storyErr);
      // Non facciamo fallire l'intero cron job se fallisce solo la storia
    }

    return NextResponse.json({ 
      success: true, 
      message: "Marketing pubblicato con successo!",
      ig_post_id: publishData.id,
      ig_story_id: storyId,
      image_used: selectedImage,
      caption: captionText
    });

  } catch (error: any) {
    console.error("Marketing Cron Error:", error);
    return NextResponse.json({ error: error.message || "Errore interno" }, { status: 500 });
  }
}
