require('dotenv').config();
const { generateObject } = require('ai');
const { google } = require('@ai-sdk/google');
const { z } = require('zod');

async function publishNow() {
  try {
    console.log("Inizio pubblicazione manuale...");
    
    // 0. Seleziono l'asset
    // Simulo il file lib/marketing-rotation.ts
    const category = "Estetica e Centri Benessere";
    const hashtags = "#NeatX #CentroEstetico #EstetistaItalia #AgendaEstetica #GestioneCentroEstetico";
    
    // 1. Immagine
    const seed = Math.floor(Date.now() / 1000);
    const prompt = "bright clean luxurious beauty salon and spa interior, minimalist, highly aesthetic, no people (unique seed: " + seed + ")";
    const selectedImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true&seed=${seed}`;
    const watermarkedImage = `https://demo-neatx-app.vercel.app/api/og/marketing?bg=${encodeURIComponent(selectedImage)}`;
    
    console.log("Immagine creata:", watermarkedImage);
    console.log("Generazione testo AI in corso...");

    // 2. Testo
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        caption: z.string()
      }),
      messages: [
        {
          role: "user",
          content: `Agisci come un Senior Social Media Strategist.
Stai gestendo l'account Instagram di 'NeatX', un software SaaS italiano (Agenda, Prenotazioni Online).
OGGI DEVI RIVOLGERTI ESCLUSIVAMENTE A: ${category}.
Scrivi un post Instagram ad altissima conversione: 
1. VIRAL HOOK
2. TRIGGER EMOTIVO (frustrazione agende di carta)
3. LA SOLUZIONE (NeatX)
4. CALL TO ACTION (link in bio).
Aggiungi hashtag: ${hashtags}. Restituisci solo il testo.`
        }
      ]
    });

    const captionText = object.caption;
    console.log("Testo generato:\n", captionText);

    // 3. Pubblicazione
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const token = process.env.META_PERMANENT_TOKEN;

    console.log("Caricamento su Facebook/Instagram...");
    
    // Prewarm URL
    await globalThis.fetch(watermarkedImage).catch(() => {});

    // Step A: Create Media
    const mediaRes = await globalThis.fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?image_url=${encodeURIComponent(watermarkedImage)}&caption=${encodeURIComponent(captionText)}&access_token=${token}`, {
      method: "POST"
    });
    const mediaData = await mediaRes.json();
    if (mediaData.error) throw new Error(mediaData.error.message);
    
    const creationId = mediaData.id;
    console.log("Media creato con ID:", creationId);

    // Step B: Publish Media
    console.log("Pubblicazione finale sul feed...");
    const publishRes = await globalThis.fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish?creation_id=${creationId}&access_token=${token}`, {
      method: "POST"
    });
    const publishData = await publishRes.json();
    if (publishData.error) throw new Error(publishData.error.message);

    console.log("✅ PUBBLICATO CON SUCCESSO! ID Post:", publishData.id);

  } catch (error) {
    console.error("❌ ERRORE:", error);
  }
}

publishNow();
