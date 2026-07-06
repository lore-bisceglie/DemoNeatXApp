import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 30;

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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      systemInstruction: systemPrompt,
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = result.response.text();

    return Response.json({ reply: response });
  } catch (error) {
    console.error("Chat API Error:", error);
    return Response.json({ reply: "Mi dispiace, c'è stato un problema tecnico. Riprova tra qualche secondo! 🔧" }, { status: 200 });
  }
}
