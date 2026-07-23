import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { prisma } from "@/lib/prisma"; // Assuming standard prisma import

export const maxDuration = 60; // Max execution time 60 seconds

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    
    const url = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET;
    
    if (
      authHeader !== `Bearer ${cronSecret}` && 
      url.searchParams.get("key") !== cronSecret
    ) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // 1. Generiamo l'articolo del blog con l'IA
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        title: z.string().describe("Titolo accattivante SEO-friendly (H1)"),
        slug: z.string().describe("URL slug SEO-friendly tutto minuscolo con trattini"),
        excerpt: z.string().describe("Riassunto breve per la preview (max 2 frasi)"),
        seoKeywords: z.string().describe("3-5 keyword separate da virgola"),
        content: z.string().describe("L'intero articolo formatto in Markdown. Includi h2, h3, bullet points e una chiusura forte che promuove la prova gratuita di NeatX come soluzione definitiva al problema descritto."),
      }),
      messages: [
        {
          role: "user",
          content: `Sei un esperto SEO Content Writer per 'NeatX', un software SaaS gestionale per professionisti su appuntamento (saloni, barbieri, centri estetici, studi medici).
          
Oggi devi scrivere un articolo di alta qualità per l'Academy del sito.
Scegli UNO dei problemi più urgenti per questa nicchia (es: come evitare i no-show, come fidelizzare i clienti, come organizzare i turni dei dipendenti, come gestire gli incassi o le ricevute telematiche).

Scrivi un articolo lungo, approfondito e formattato in Markdown. Dai valore reale e strategie pratiche, poi alla fine inserisci NeatX come la soluzione tecnologica automatizzata per eccellenza.`,
        },
      ],
    });

    // 2. Immagine copertina dinamica gratuita da pollinations
    const randomSeed = Math.floor(Math.random() * 100000);
    const imageUrl = `https://image.pollinations.ai/prompt/modern%20luxury%20salon%20interior%20or%20professional%20office%20minimalist%20aesthetic?nologo=true&seed=${randomSeed}&width=1200&height=630`;

    // 3. Salva nel Database (AcademyArticle)
    const newArticle = await prisma.academyArticle.create({
      data: {
        title: object.title,
        slug: object.slug,
        excerpt: object.excerpt,
        seoKeywords: object.seoKeywords,
        content: object.content,
        imageUrl: imageUrl,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Articolo Academy generato e pubblicato!",
      article: newArticle
    });

  } catch (error: any) {
    console.error("Academy Cron Error:", error);
    return NextResponse.json({ error: error.message || "Errore interno" }, { status: 500 });
  }
}
