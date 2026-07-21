import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const CATEGORIES = [
  {
    name: "Barbieri e Parrucchieri Uomo",
    hashtags: "#NeatX #AgendaBarbiere #BarbiereItalia #ParrucchiereItalia #GestioneSalone",
    images: [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop",
    ]
  },
  {
    name: "Estetica e Centri Benessere",
    hashtags: "#NeatX #CentroEstetico #EstetistaItalia #AgendaEstetica #GestioneCentroEstetico",
    images: [
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=1200&auto=format&fit=crop"
    ]
  },
  {
    name: "Parrucchieri Donna e Saloni di Bellezza",
    hashtags: "#NeatX #ParrucchieraItalia #SaloneDiBellezza #AgendaParrucchiere #HairStylistItalia",
    images: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521590832167-7bfc17484d20?q=80&w=1200&auto=format&fit=crop"
    ]
  },
  {
    name: "Tatuatori e Studi di Tattoo",
    hashtags: "#NeatX #TattooItalia #TatuatoreItaliano #AgendaTattoo #TattooStudioItalia",
    images: [
      "https://images.unsplash.com/photo-1598371839696-5e5bb00b059f?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1568347355280-eecc6c3b6526?q=80&w=1200&auto=format&fit=crop"
    ]
  }
];

async function main() {
  try {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const randomImage = category.images[Math.floor(Math.random() * category.images.length)];
    const watermarkedImage = `https://demo-neatx-app.vercel.app/api/og/marketing?bg=${encodeURIComponent(randomImage)}`;

    console.log("Generazione copy con Gemini...");
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        caption: z.string().describe("Il testo persuasivo per il post Instagram. Max 3-4 paragrafi corti."),
      }),
      messages: [
        {
          role: "user",
          content: `Sei il Social Media Manager di 'NeatX', una startup italiana che vende un software gestionale (Agenda, Appuntamenti, Prenotazioni Online) per il settore beauty e wellness.
          
OGGI DEVI RIVOLGERTI ESCLUSIVAMENTE A: ${category.name}.

Scrivi un post coinvolgente per Instagram per convincere i professionisti di questo settore ad abbonarsi. Scegli un problema specifico del loro lavoro (es. appuntamenti sovrapposti, chiamate mentre stanno lavorando con le mani occupate, clienti che non si presentano all'appuntamento) e offri NeatX come la soluzione definitiva. Usa un tono dinamico, professionale ma giovane. DEVI ASSOLUTAMENTE aggiungere 5-8 hashtag in fondo al post, tra cui: ${category.hashtags}. Concludi sempre dicendo di cliccare il link in bio per provare gratis per 14 giorni.`,
        },
      ],
    });

    const captionText = object.caption;
    console.log("Caption generata:", captionText);

    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const token = process.env.META_PERMANENT_TOKEN;

    if (!igAccountId || !token) {
      throw new Error("Credenziali Instagram mancanti in .env");
    }

    // --- POST FEED COMMENTATO ---
    /*
    console.log("Creazione Media su IG...");
    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?image_url=${encodeURIComponent(watermarkedImage)}&caption=${encodeURIComponent(captionText)}&access_token=${token}`, {
      method: "POST"
    });
    
    const mediaData = await mediaRes.json();
    if (mediaData.error) {
      throw new Error("Errore creazione media su IG: " + mediaData.error.message);
    }
    
    const creationId = mediaData.id;

    console.log("Pubblicazione Media su IG...");
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish?creation_id=${creationId}&access_token=${token}`, {
      method: "POST"
    });

    const publishData = await publishRes.json();
    if (publishData.error) {
      throw new Error("Errore pubblicazione su IG: " + publishData.error.message);
    }

    console.log("Post feed pubblicato con successo!", publishData);
    */

    // --- PUBBLICAZIONE STORIA ---
    console.log("Generazione Media Storia su IG...");
    const storyImage = `https://demo-neatx-app.vercel.app/api/og/story?bg=${encodeURIComponent(randomImage)}`;
    
    const storyMediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?image_url=${encodeURIComponent(storyImage)}&media_type=STORIES&access_token=${token}`, {
      method: "POST"
    });
    const storyMediaData = await storyMediaRes.json();
    
    if (storyMediaData.error) {
      throw new Error("Errore creazione media Storia su IG: " + storyMediaData.error.message);
    }

    console.log("Pubblicazione Media Storia su IG...");
    const storyPublishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish?creation_id=${storyMediaData.id}&access_token=${token}`, {
      method: "POST"
    });
    const storyPublishData = await storyPublishRes.json();

    if (storyPublishData.error) {
      throw new Error("Errore pubblicazione Storia su IG: " + storyPublishData.error.message);
    }

    console.log("Storia pubblicata con successo!", storyPublishData);

  } catch (err) {
    console.error("Errore:", err);
  }
}

main();
