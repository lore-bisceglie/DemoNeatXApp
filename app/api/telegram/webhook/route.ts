import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendTelegramMessage } from "@/lib/telegram";

const prisma = new PrismaClient();

// Invia una risposta al click di un bottone inline per far smettere di caricare l'orologino
async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  
  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || "",
    }),
  });
}

// Aggiorna un messaggio (es. rimuove i bottoni dopo che è stato premuto)
async function editMessageText(chatId: string, messageId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  
  const url = `https://api.telegram.org/bot${botToken}/editMessageText`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: "HTML"
    }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authorizedChatId = process.env.TELEGRAM_CHAT_ID;

    // 1. Gestione Callback Query (Bottoni Inline)
    if (body.callback_query) {
      const cb = body.callback_query;
      const chatId = cb.message.chat.id.toString();
      const messageId = cb.message.message_id;
      const data = cb.data; // es. "approve_123" o "delete_123"

      // Sicurezza: esegue comandi solo se cliccati dal Boss
      if (chatId !== authorizedChatId) {
        await answerCallbackQuery(cb.id, "Non sei autorizzato.");
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("delete_")) {
        const tenantId = data.replace("delete_", "");
        try {
          await prisma.tenant.delete({ where: { id: tenantId } });
          await answerCallbackQuery(cb.id, "❌ Salone eliminato definitivamente!");
          await editMessageText(chatId, messageId, `<s>${cb.message.text}</s>\n\n<b>[Eliminato come SPAM]</b>`);
        } catch (e) {
          await answerCallbackQuery(cb.id, "Errore durante l'eliminazione.");
        }
      }
      else if (data.startsWith("suspend_")) {
        const tenantId = data.replace("suspend_", "");
        try {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { trialStatus: "suspended" }
          });
          await answerCallbackQuery(cb.id, "🔒 Salone Sospeso!");
          await editMessageText(chatId, messageId, `<s>${cb.message.text}</s>\n\n<b>[Account Sospeso]</b>`);
        } catch (e) {
          await answerCallbackQuery(cb.id, "Errore durante la sospensione.");
        }
      }
      else if (data.startsWith("approve_")) {
        const tenantId = data.replace("approve_", "");
        try {
          // Aggiorniamo il piano a Premium
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { plan: "premium" }
          });
          await answerCallbackQuery(cb.id, "✅ Salone promosso a PRO!");
          await editMessageText(chatId, messageId, `${cb.message.text}\n\n<b>[Approvato: Piano PRO attivo]</b>`);
        } catch (e) {
          await answerCallbackQuery(cb.id, "Errore durante l'approvazione.");
        }
      }

      return NextResponse.json({ ok: true });
    }

    // 2. Gestione Messaggi di Testo (Comandi)
    if (body.message && body.message.text) {
      const text = body.message.text.trim();
      const chatId = body.message.chat.id.toString();

      // Sicurezza
      if (chatId !== authorizedChatId) {
        return NextResponse.json({ ok: true });
      }

      if (text === "/stats") {
        // Calcolo rapido statistiche
        const tenantsCount = await prisma.tenant.count();
        const appointmentsCount = await prisma.appointment.count();
        const mrr = tenantsCount * 29.99; // Stima di 30€ al mese per salone
        
        const reply = `📊 <b>STATISTICHE NEATX</b>\n\n🏢 <b>Saloni iscritti:</b> ${tenantsCount}\n📅 <b>Prenotazioni totali:</b> ${appointmentsCount}\n💰 <b>MRR Stimato:</b> ${mrr.toFixed(2)}€`;
        await sendTelegramMessage(reply);
      } 
      else if (text === "/ultimi") {
        const latest = await prisma.tenant.findMany({
          take: 3,
          orderBy: { createdAt: "desc" },
          select: { name: true, category: true, city: true }
        });
        
        let reply = `🆕 <b>ULTIMI 3 SALONI ISCRITTI</b>\n\n`;
        latest.forEach((t, i) => {
          reply += `${i+1}. <b>${t.name}</b> (${t.category})\n📍 ${t.city}\n\n`;
        });
        await sendTelegramMessage(reply);
      }
      else if (text.startsWith("/cerca ")) {
        const query = text.replace("/cerca ", "").trim();
        if (query.length < 2) {
          await sendTelegramMessage("⚠️ Inserisci almeno 2 lettere per cercare.");
        } else {
          const results = await prisma.tenant.findMany({
            where: { name: { contains: query, mode: "insensitive" } },
            take: 5,
            select: { id: true, name: true, phone: true, ownerEmail: true, city: true, slug: true }
          });
          
          if (results.length === 0) {
            await sendTelegramMessage(`Nessun salone trovato per "<b>${query}</b>"`);
          } else {
            await sendTelegramMessage(`🔍 <b>Trovati ${results.length} risultati per "${query}":</b>`);
            for (const r of results) {
              let reply = `🏢 <b>${r.name}</b> (${r.city})\n`;
              if (r.phone) reply += `📞 ${r.phone}\n`;
              if (r.ownerEmail) reply += `✉️ ${r.ownerEmail}\n`;
              reply += `🔗 demo-neatx.vercel.app/t/${r.slug}`;
              
              const markup = {
                inline_keyboard: [
                  [
                    { text: "🔴 Elimina", callback_data: `delete_${r.id}` },
                    { text: "🔒 Sospendi", callback_data: `suspend_${r.id}` }
                  ]
                ]
              };
              
              await sendTelegramMessage(reply, markup);
            }
          }
        }
      }
      else if (text.startsWith("/entra ")) {
        const query = text.replace("/entra ", "").trim();
        if (query.length < 2) {
          await sendTelegramMessage("⚠️ Inserisci almeno 2 lettere del negozio in cui vuoi entrare.");
        } else {
          const tenant = await prisma.tenant.findFirst({
            where: { name: { contains: query, mode: "insensitive" } }
          });
          
          if (!tenant) {
            await sendTelegramMessage(`Nessun salone trovato per "<b>${query}</b>"`);
          } else {
            const magicLink = `https://demo-neatx.vercel.app/api/telegram/magic?slug=${tenant.slug}&secret=${tenant.adminPassword}`;
            await sendTelegramMessage(`🕵️‍♂️ <b>Login Magico per ${tenant.name}</b>\n\nClicca qui sotto per entrare nel suo gestionale scavalcando la password:\n🔗 ${magicLink}`);
          }
        }
      }
      else if (text.startsWith("/avvisa ")) {
        const message = text.replace("/avvisa ", "").trim();
        if (message.length < 5) {
          await sendTelegramMessage("⚠️ Il messaggio da inviare a tutti deve essere più lungo.");
        } else {
          const tenants = await prisma.tenant.findMany({
            where: { ownerEmail: { not: null } },
            select: { ownerEmail: true, name: true }
          });
          
          await sendTelegramMessage(`📣 <b>Megafono:</b> Simulazione di invio email a ${tenants.length} saloni completata con il messaggio:\n"${message}"`);
        }
      }
      else if (text.startsWith("/pro ")) {
        const query = text.replace("/pro ", "").trim();
        const tenant = await prisma.tenant.findFirst({ where: { name: { contains: query, mode: "insensitive" } } });
        if (tenant) {
          await prisma.tenant.update({ where: { id: tenant.id }, data: { plan: "premium" } });
          await sendTelegramMessage(`✅ <b>${tenant.name}</b> promosso al piano <b>PRO</b> (59€)!\nI lucchetti sono stati sbloccati.`);
        } else {
          await sendTelegramMessage("❌ Nessun salone trovato.");
        }
      }
      else if (text.startsWith("/basic ")) {
        const query = text.replace("/basic ", "").trim();
        const tenant = await prisma.tenant.findFirst({ where: { name: { contains: query, mode: "insensitive" } } });
        if (tenant) {
          await prisma.tenant.update({ where: { id: tenant.id }, data: { plan: "basic" } });
          await sendTelegramMessage(`🔒 <b>${tenant.name}</b> retrocesso al piano <b>BASIC</b> (29€)!\nI lucchetti sono stati riattivati.`);
        } else {
          await sendTelegramMessage("❌ Nessun salone trovato.");
        }
      }
      else if (text.startsWith("/sms ")) {
        const parts = text.replace("/sms ", "").trim().split(" ");
        if (parts.length === 2) {
          const query = parts[0];
          const amount = parseInt(parts[1], 10);
          
          if (!isNaN(amount) && amount > 0) {
            const tenant = await prisma.tenant.findFirst({ where: { name: { contains: query, mode: "insensitive" } } });
            if (tenant) {
              const storeSettings = await prisma.storeSettings.upsert({
                where: { tenantId: tenant.id },
                create: { tenantId: tenant.id, smsCredits: amount },
                update: { smsCredits: { increment: amount } }
              });
              await sendTelegramMessage(`✅ <b>${tenant.name}</b> ricaricato di <b>${amount} SMS</b>!\nNuovo saldo totale: ${storeSettings.smsCredits} SMS.`);
            } else {
              await sendTelegramMessage("❌ Nessun salone trovato con quel nome.");
            }
          } else {
            await sendTelegramMessage("⚠️ Inserisci un importo valido (es. /sms beart 100).");
          }
        } else {
          await sendTelegramMessage("⚠️ Formato errato. Usa: /sms [nome] [crediti] (es. /sms beart 100)");
        }
      }
      else if (text === "/aiuto") {
        const helpText = `🛠️ <b>Guida ai Comandi</b>\n\n` +
          `/stats - Riepilogo saloni attivi, prenotazioni e MRR\n` +
          `/ultimi - Elenco degli ultimi 3 saloni iscritti\n` +
          `/cerca [nome] - Trova un salone per nome e mostra i contatti\n` +
          `/entra [nome] - Crea un link per entrare nel pannello di un negozio\n` +
          `/pro [nome] - Promuove un negozio al piano PRO\n` +
          `/basic [nome] - Retrocede un negozio al piano BASIC\n` +
          `/sms [nome] [crediti] - Ricarica pacchetto messaggi SMS (es. /sms beart 100)\n` +
          `/avvisa [messaggio] - Invia una mail a tutti i negozi\n` +
          `/aiuto - Mostra questo messaggio`;
        await sendTelegramMessage(helpText);
      }
      else if (text === "/start") {
        await sendTelegramMessage("🤖 <b>NeatX Maggiordomo</b>\nAi tuoi ordini, Capo. Usa il bottone Menu in basso a sinistra per vedere cosa so fare, o digita /aiuto.");
      }

      return NextResponse.json({ ok: true });
    }

    // Se arrivano altri tipi di aggiornamenti
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Errore Webhook Telegram:", error);
    return NextResponse.json({ ok: true }); // Restituiamo sempre 200 a Telegram per non fargli ritentare in loop
  }
}
