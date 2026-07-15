import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";

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
          // Attivazione manuale (es. pagamento bonifico/contanti)
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { plan: "elite", trialStatus: "converted", trialEndsAt: null }
          });
          await answerCallbackQuery(cb.id, "✅ Salone attivato manualmente (Elite)!");
          await editMessageText(chatId, messageId, `${cb.message.text}\n\n<b>[Attivato Manualmente: Piano ELITE definitivo]</b>`);
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
        const mrr = tenantsCount * 29; // Stima di 30€ al mese per salone
        
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
            where: { name: { contains: query } },
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
              reply += `🔗 neatx.store/t/${r.slug}`;
              
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
              where: { name: { contains: query } }
          });
          
          if (!tenant) {
            await sendTelegramMessage(`Nessun salone trovato per "<b>${query}</b>"`);
          } else {
            const magicLink = `https://www.neatx.store/api/telegram/magic?slug=${tenant.slug}&secret=${tenant.adminPassword}`;
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
        const tenant = await prisma.tenant.findFirst({ where: { name: { contains: query } } });
        if (tenant) {
          await prisma.tenant.update({ where: { id: tenant.id }, data: { plan: "pro" } });
          await sendTelegramMessage(`✅ <b>${tenant.name}</b> promosso al piano <b>PRO</b> (29€)!\nI lucchetti sono stati sbloccati.`);
        } else {
          await sendTelegramMessage("❌ Nessun salone trovato.");
        }
      }
      else if (text.startsWith("/basic ")) {
        const query = text.replace("/basic ", "").trim();
        const tenant = await prisma.tenant.findFirst({ where: { name: { contains: query } } });
        if (tenant) {
          await prisma.tenant.update({ where: { id: tenant.id }, data: { plan: "basic" } });
          await sendTelegramMessage(`🔒 <b>${tenant.name}</b> retrocesso al piano <b>Basic</b> (trial gratuito)!\nI lucchetti sono stati riattivati.`);
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
const tenant = await prisma.tenant.findFirst({ where: { name: { contains: query } } });
            if (tenant) {
              const storeSettings = await prisma.storeSettings.upsert({
                where: { tenantId: tenant.id },
                create: { tenantId: tenant.id, smsCredits: amount },
                update: { smsCredits: { increment: amount } }
              });
              await sendTelegramMessage(`✅ <b>${tenant.name}</b> ricaricato di <b>${amount} pacchetti WhatsApp</b>!\nNuovo saldo totale: ${storeSettings.smsCredits} messaggi.`);
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
      else if (text.startsWith("/sedi ")) {
        const query = text.replace("/sedi ", "").trim();
        if (query.length < 2) {
          await sendTelegramMessage("⚠️ Inserisci almeno 2 lettere del nome del salone.");
        } else {
          const tenant = await prisma.tenant.findFirst({ where: { name: { contains: query } } });
          if (!tenant) {
            await sendTelegramMessage(`❌ Nessun salone trovato per "<b>${query}</b>"`);
          } else {
            const locations = await prisma.location.findMany({
              where: { tenantId: tenant.id },
              include: { settings: true },
              orderBy: { isMain: 'desc' },
            });
            if (locations.length === 0) {
              await sendTelegramMessage(`🏢 <b>${tenant.name}</b>\nNessuna sede configurata. Usa /nuova-sede per crearne una.`);
            } else {
              let reply = `🏢 <b>${tenant.name}</b> — <b>${locations.length} sedi</b>\n\n`;
              for (const loc of locations) {
                reply += `${loc.isMain ? '⭐' : '📍'} <b>${loc.name}</b> (/${loc.slug})\n`;
                if (loc.address) reply += `   📍 ${loc.address}\n`;
                if (loc.phone) reply += `   📞 ${loc.phone}\n`;
                if (loc.openTime && loc.closeTime) reply += `   🕐 ${loc.openTime} - ${loc.closeTime}\n`;
                reply += `   ${loc.isActive ? '✅ Attiva' : '❌ Disattiva'}`;
                reply += `\n\n`;
              }
              await sendTelegramMessage(reply);
            }
          }
        }
      }
      else if (text.startsWith("/sms-sede ")) {
        const parts = text.replace("/sms-sede ", "").trim().split(" ");
        if (parts.length === 3) {
          const query = parts[0];
          const slug = parts[1];
          const amount = parseInt(parts[2], 10);
          if (!isNaN(amount) && amount > 0) {
            const tenant = await prisma.tenant.findFirst({ where: { name: { contains: query } } });
            if (!tenant) {
              await sendTelegramMessage("❌ Nessun salone trovato.");
            } else {
              const ss = await prisma.storeSettings.upsert({
                where: { tenantId: tenant.id },
                create: { tenantId: tenant.id, smsCredits: amount },
                update: { smsCredits: { increment: amount } },
              });
              await sendTelegramMessage(`✅ <b>${tenant.name}</b> ricaricato di <b>${amount} SMS</b>!\nNuovo saldo totale: ${ss.smsCredits} messaggi.`);

            }
          } else {
            await sendTelegramMessage("⚠️ Inserisci un importo valido (es. /sms-sede beart principale 100).");
          }
        } else {
          await sendTelegramMessage("⚠️ Formato errato. Usa: /sms-sede [nome] [slug-sede] [crediti] (es. /sms-sede beart principale 100)");
        }
      }
      else if (text.startsWith("/nuova-sede ")) {
        const parts = text.replace("/nuova-sede ", "").trim().split(" ");
        if (parts.length >= 2) {
          const query = parts[0];
          const slug = parts[1].toLowerCase().replace(/[^a-z0-9-]/g, '');
          const phone = parts.slice(2).join(' ') || undefined;
          if (slug.length < 2) {
            await sendTelegramMessage("⚠️ Slug non valido. Usa solo lettere, numeri e trattini (es. /nuova-sede beart centro).");
          } else {
            const tenant = await prisma.tenant.findFirst({ where: { name: { contains: query } } });
            if (!tenant) {
              await sendTelegramMessage("❌ Nessun salone trovato.");
            } else {
              const existing = await prisma.location.findFirst({ where: { tenantId: tenant.id, slug } });
              if (existing) {
                await sendTelegramMessage(`❌ Slug "/${slug}" già esistente per ${tenant.name}.`);
              } else {
                const location = await prisma.location.create({
                  data: {
                    name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
                    slug,
                    phone,
                    tenantId: tenant.id,
                  },
                });
                await prisma.locationSettings.create({ data: { locationId: location.id } });
                const services = await prisma.service.findMany({ where: { tenantId: tenant.id } });
                if (services.length > 0) {
                  await prisma.serviceLocation.createMany({
                    data: services.map(s => ({ serviceId: s.id, locationId: location.id, price: s.price })),
                  });
                }
                await sendTelegramMessage(`✅ <b>${tenant.name}</b> — Nuova sede creata!\n🏪 <b>${location.name}</b> (/${slug})\n📞 ${phone || 'Non specificato'}\n📎 Servizi collegati: ${services.length}`);
              }
            }
          }
        } else {
          await sendTelegramMessage("⚠️ Formato errato. Usa: /nuova-sede [nome] [slug] [telefono?] (es. /nuova-sede beart centro +393331234567)");
        }
      }
      else if (text === "/agents") {
        let totalLeads = 0, newLeads = 0;
        try { totalLeads = await prisma.lead.count(); } catch {}
        try { newLeads = await prisma.lead.count({ where: { status: 'new' } }); } catch {}
        const activeTrials = await prisma.tenant.count({ where: { trialStatus: { in: ['trial_active', 'demo', 'published'] }, plan: { notIn: ['pro', 'elite'] } } });
        const paying = await prisma.tenant.count({ where: { trialStatus: 'converted' } });
        const expired = await prisma.tenant.count({ where: { trialStatus: 'expired' } });
        const reply =
          `🤖 <b>STATO AGENTI NEATX</b>\n\n` +
          `👤 <b>Lead:</b> ${totalLeads} totali, ${newLeads} nuovi\n` +
          `🏢 <b>Tenant:</b> ${activeTrials} trial, ${paying} paganti, ${expired} scaduti\n\n` +
          `Usa /agent run per eseguire tutti gli agenti ora.`;
        await sendTelegramMessage(reply);
      }
      else if (text === "/agent run") {
        try {
          const token = process.env.GITHUB_TOKEN || process.env.GH_PAT;
          if (!token) {
            await sendTelegramMessage("❌ GITHUB_TOKEN non configurato. Imposta la variabile d'ambiente.");
          } else {
            const res = await fetch("https://api.github.com/repos/neatxinfo-db/DemoNeatXApp/actions/workflows/auto-neatx-agents.yml/dispatches", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ ref: "main" }),
            });
            if (res.ok) {
              await sendTelegramMessage("✅ Agenti triggerati su GitHub Actions. Controlla tra un paio di minuti.");
            } else {
              await sendTelegramMessage(`❌ Errore trigger: ${res.status}`);
            }
          }
        } catch {
          await sendTelegramMessage("❌ Errore nel triggerare gli agenti.");
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
          `/sms [nome] [crediti] - Ricarica pacchetto messaggi WhatsApp (es. /sms beart 100)\n` +
          `/sedi [nome] - Elenca tutte le sedi di un salone\n` +
          `/sms-sede [nome] [slug] [crediti] - Ricarica SMS per una sede specifica (es. /sms-sede beart principale 100)\n` +
          `/nuova-sede [nome] [slug] [telefono?] - Crea una nuova sede per un salone\n` +
          `/avvisa [messaggio] - Invia una mail a tutti i negozi\n` +
          `/agents - Mostra lo stato degli agenti automatici\n` +
          `/agent run - Esegue tutti gli agenti ora su GitHub\n` +
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
