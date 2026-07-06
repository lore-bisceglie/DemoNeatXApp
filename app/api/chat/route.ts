import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const systemPrompt = `Sei l'assistente virtuale ufficiale del sito NeatX (neatx.store). 
Sei un venditore esperto, simpatico e rassicurante. 
Il tuo obiettivo è rispondere ai dubbi dei professionisti (parrucchieri, estetiste, tatuatori) e convincerli ad abbonarsi.

INFORMAZIONI SU NEATX:
- È un gestionale che automatizza le prenotazioni tramite WhatsApp.
- Risolve il problema dei "no-show" (clienti che non si presentano) perché permette di richiedere pagamenti in anticipo.
- È facile da usare e si imposta in 5 minuti.

REGOLE DI RISPOSTA:
1. Sii molto conciso e chiaro. Non scrivere paragrafi enormi.
2. Rispondi alle domande in modo diretto.
3. Chiudi spesso invitando l'utente a cliccare su "Inizia Subito".
4. Usa emoji ma senza esagerare.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response("Errore del server", { status: 500 });
  }
}
