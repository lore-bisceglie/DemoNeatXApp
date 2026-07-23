import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

const topics = [
  {
    topic: "Il vero motivo per cui i clienti non si presentano e ti fanno perdere soldi.",
    angle: "Angolo non ovvio: Non è colpa del traffico, è che non percepiscono l'impegno economico. Spiega la cosa che nessuno ha il coraggio di dire: se il servizio è 'prenota gratis', la disdetta psicologica è gratis. Anticipa l'obiezione: 'Ma se chiedo l'acconto i clienti scappano'.",
  },
  {
    topic: "Gestione del tempo nel salone: smettila di fare la segretaria.",
    angle: "Angolo non ovvio: Ogni volta che rispondi al telefono o a un DM su Instagram mentre tagli, perdi autorevolezza col cliente in poltrona. Il telefono è il tuo nemico. Anticipa l'obiezione: 'Ma i miei clienti vogliono parlare con me'.",
  },
  {
    topic: "Come BarberApp e Treatwell stanno uccidendo la tua identità di brand.",
    angle: "Angolo non ovvio: Sei solo un nome in un elenco infinito di competitor, giudicato solo per il prezzo o per le stelline. Spiega perché avere un 'software privato' (White Label/Proprietario) alza il percepito del tuo salone. Anticipa l'obiezione: 'Eh ma Treatwell mi porta clienti nuovi'.",
  },
  {
    topic: "Aumentare i prezzi senza perdere i clienti storici nel 2026.",
    angle: "Angolo non ovvio: I clienti non pagano il taglio, pagano l'esperienza e l'esclusività. Se hai un'app premium per farli prenotare, giustifichi un aumento di 5€. Anticipa l'obiezione: 'Se alzo i prezzi c'è crisi e non viene più nessuno'.",
  },
  {
    topic: "Analisi Dati: Cosa ti nasconde il tuo cassetto degli incassi.",
    angle: "Angolo non ovvio: Guardare a fine sera quanti soldi hai fatto è inutile. Devi sapere quale servizio ti porta il margine più alto in meno tempo. Spiega l'importanza delle Analytics in tempo reale. Anticipa l'obiezione: 'Io faccio il barbiere, non il commercialista'.",
  }
];

async function run() {
  console.log("Generazione 5 articoli SEO Avanzati...");

  for (const t of topics) {
    console.log(`\nGenerazione: ${t.topic}`);
    
    try {
      const { object } = await generateObject({
        model: google('gemini-2.5-flash'),
        system: "Sei un Copywriter d'assalto e spietato, esperto di SEO e Marketing per saloni di bellezza e barbieri. Lavori per NeatX.",
        schema: z.object({
          title: z.string(),
          slug: z.string(),
          excerpt: z.string(),
          seoKeywords: z.string(),
          content: z.string(),
        }),
        messages: [
          {
            role: "user",
            content: `Obiettivo: Scrivere un articolo SEO bomba per far capire ai barbieri che NeatX è superiore a tutto.
            Tema centrale: ${t.topic}
            Strategia e Angolo: ${t.angle}
            
            Criteri di scrittura:
            - Ritmo incalzante e veloce. Frasi brevi. Niente burocratese.
            - Usa formattazione Markdown con H2, H3, e liste.
            - Lunghezza: almeno 500 parole.
            - Chiudi sempre l'articolo vendendo elegantemente la soluzione: usare NeatX (che gestisce acconti su Stripe, agenda privata e zero commissioni).`
          }
        ],
      });

      const randomSeed = Math.floor(Math.random() * 100000);
      const imageUrl = `https://image.pollinations.ai/prompt/dark%20luxury%20barber%20shop%20or%20salon%20${Math.floor(Math.random() * 10)}?nologo=true&seed=${randomSeed}&width=1200&height=630`;

      await prisma.academyArticle.create({
        data: {
          title: object.title,
          slug: object.slug,
          excerpt: object.excerpt,
          seoKeywords: object.seoKeywords,
          content: object.content,
          imageUrl: imageUrl,
        }
      });

      console.log(`✅ Creato: ${object.title}`);
    } catch (err) {
      console.error(`❌ Errore con l'articolo: ${t.topic}`, err);
    }
  }
  console.log("Finito! Tutti gli articoli sono nel database SQLite.");
}

run();
