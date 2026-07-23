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
          content: `Agisci come un Senior Social Media Strategist e Copywriter Esperto (con focus su Niche Intelligence e Viral Hook Creation).
          
Stai gestendo l'account Instagram di 'NeatX', un software SaaS italiano che offre un gestionale all-in-one (Agenda, Prenotazioni Online, SMS Marketing) per TUTTE le attività e i professionisti che lavorano su appuntamenti (saloni, centri estetici, tattoo, studi medici, consulenti, ecc.).
Il tuo posizionamento (Market Positioning): NeatX è l'assistente invisibile che libera i professionisti dal caos delle prenotazioni. Il tono è dinamico, empatico, autorevole ma disruptive.

OGGI DEVI RIVOLGERTI ESCLUSIVAMENTE A: ${asset.category}.

Scrivi un post Instagram ad altissima conversione seguendo questa architettura (Content Pillar & Viral Hook):

1. VIRAL HOOK (Gancio): Inizia con una frase "scroll-stopping" per catturare l'attenzione nei primi 2 secondi (usa curiosità o bold statement sul loro lavoro).
2. TRIGGER EMOTIVO E FRUSTRAZIONE (Niche Intelligence): Fai leva sul dolore più grande di questa specifica nicchia (es. appuntamenti sovrapposti, telefonate mentre si lavora, no-show).
3. LA SOLUZIONE: Presenta NeatX come il vero cambio di vita per risolvere quel problema specifico, in modo molto conciso.
4. STRATEGIC CTA (Call to Action): Concludi sempre invitando in modo irresistibile a cliccare il link in bio per provare gratis per 14 giorni.

DEVI ASSOLUTAMENTE aggiungere 5-8 hashtag in fondo al post, tra cui: ${asset.hashtags}. Restituisci solo il testo finale pronto per la pubblicazione.`,
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
