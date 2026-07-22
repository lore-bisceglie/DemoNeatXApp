import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";
import { createTenantSessionToken } from "@/lib/auth";
import { getTelegramWebhookSecret } from "@/lib/telegram-auth";
import { awardReferrerForConversion } from "@/lib/referral";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store";
const WHATSAPP_DISABLED_NOTE =
  "Nota: i promemoria WhatsApp restano disattivati. Questi sono crediti messaggio contabilizzati, non invii automatici.";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function publicStoreUrl(slug: string) {
  return `https://${ROOT_DOMAIN}/t/${slug}`;
}

async function findTenantByName(query: string) {
  return prisma.tenant.findFirst({
    where: { name: { contains: query, mode: "insensitive" } },
  });
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || "",
    }),
  });
}

async function editMessageText(chatId: string, messageId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
    }),
  });
}

function helpMessage() {
  return (
    "🛠️ <b>Comandi NeatX Admin</b>\n\n" +
    "/stats - Stato saloni, piani, prenotazioni e MRR stimato\n" +
    "/ultimi - Ultimi 3 saloni registrati\n" +
    "/cerca [nome] - Cerca un salone e mostra contatti/link\n" +
    "/entra [nome] - Crea un link assistenza temporaneo valido 15 minuti\n" +
    "/pro [nome] - Attiva manualmente il piano Pro, senza addebito Stripe\n" +
    "/basic [nome] - Riporta un salone al piano Basic/trial, senza cancellare dati\n" +
    "/sms [nome] [crediti] - Aggiunge crediti messaggio al salone\n" +
    "/sedi [nome] - Elenca le sedi del salone\n" +
    "/sms-sede [nome] [slug-sede] [crediti] - Aggiunge crediti messaggio a una sede\n" +
    "/nuova-sede [nome] [slug] [telefono?] - Crea una sede aggiuntiva\n" +
    "/avvisa [messaggio] - Simula una comunicazione ai saloni; non invia email reali\n" +
    "/agents - Stato agenti automatici\n" +
    "/lead - Ultimi 5 contatti raccolti dal sito\n" +
    "/agent run - Avvia gli agenti su GitHub Actions\n" +
    "/aiuto - Mostra questa guida\n\n" +
    `ℹ️ ${WHATSAPP_DISABLED_NOTE}`
  );
}

export async function POST(req: Request) {
  try {
    const webhookSecret = getTelegramWebhookSecret();
    if (
      !webhookSecret ||
      req.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret
    ) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await req.json();
    const authorizedChatId = process.env.TELEGRAM_CHAT_ID;

    if (body.callback_query) {
      const cb = body.callback_query;
      const chatId = cb.message.chat.id.toString();
      const messageId = cb.message.message_id;
      const data = String(cb.data || "");

      if (chatId !== authorizedChatId) {
        await answerCallbackQuery(cb.id, "Comando non autorizzato.");
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("delete_")) {
        const tenantId = data.replace("delete_", "");
        try {
          await prisma.tenant.delete({ where: { id: tenantId } });
          await answerCallbackQuery(cb.id, "Salone eliminato.");
          await editMessageText(chatId, messageId, `<s>${escapeHtml(cb.message.text)}</s>\n\n<b>[Eliminato come spam]</b>`);
        } catch {
          await answerCallbackQuery(cb.id, "Eliminazione non completata. Controlla il salone dal pannello admin.");
        }
      } else if (data.startsWith("suspend_")) {
        const tenantId = data.replace("suspend_", "");
        try {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { trialStatus: "suspended" },
          });
          await answerCallbackQuery(cb.id, "Salone sospeso.");
          await editMessageText(chatId, messageId, `<s>${escapeHtml(cb.message.text)}</s>\n\n<b>[Account sospeso]</b>`);
        } catch {
          await answerCallbackQuery(cb.id, "Sospensione non completata. Controlla il salone dal pannello admin.");
        }
      } else if (data.startsWith("approve_")) {
        const tenantId = data.replace("approve_", "");
        try {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              plan: "elite",
              trialStatus: "converted",
              trialEndsAt: null,
              convertedAt: new Date(),
              emailVerified: true,
              emailVerifyToken: null,
              emailVerifyExpiresAt: null,
            },
          });
          await awardReferrerForConversion(tenantId, "telegram");
          await answerCallbackQuery(cb.id, "Piano Elite attivato manualmente.");
          await editMessageText(
            chatId,
            messageId,
            `${escapeHtml(cb.message.text)}\n\n<b>[Attivato manualmente: piano Elite. Referral gestito una sola volta.]</b>`
          );
        } catch {
          await answerCallbackQuery(cb.id, "Attivazione non completata. Controlla il salone dal pannello admin.");
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (body.message && body.message.text) {
      const text = String(body.message.text).trim();
      const chatId = body.message.chat.id.toString();

      if (chatId !== authorizedChatId) {
        return NextResponse.json({ ok: true });
      }

      if (text === "/stats") {
        const [
          tenantsCount,
          appointmentsCount,
          proCount,
          eliteCount,
          activeTrials,
          expiredTrials,
          suspendedCount,
        ] = await Promise.all([
          prisma.tenant.count(),
          prisma.appointment.count(),
          prisma.tenant.count({ where: { plan: "pro", trialStatus: "converted" } }),
          prisma.tenant.count({ where: { plan: "elite", trialStatus: "converted" } }),
          prisma.tenant.count({
            where: {
              trialStatus: { in: ["trial_active", "demo", "published", "active"] },
              plan: { notIn: ["pro", "elite"] },
            },
          }),
          prisma.tenant.count({ where: { trialStatus: "expired" } }),
          prisma.tenant.count({ where: { trialStatus: "suspended" } }),
        ]);
        const mrr = proCount * 29 + eliteCount * 59;

        await sendTelegramMessage(
          "📊 <b>Statistiche NeatX</b>\n\n" +
          `Saloni totali: <b>${tenantsCount}</b>\n` +
          `Trial attivi: <b>${activeTrials}</b>\n` +
          `Pro attivi: <b>${proCount}</b>\n` +
          `Elite attivi: <b>${eliteCount}</b>\n` +
          `Trial scaduti: <b>${expiredTrials}</b>\n` +
          `Sospesi: <b>${suspendedCount}</b>\n` +
          `Prenotazioni totali: <b>${appointmentsCount}</b>\n` +
          `MRR stimato da piani attivi: <b>${mrr.toFixed(2)}€</b>`
        );
      } else if (text === "/ultimi") {
        const latest = await prisma.tenant.findMany({
          take: 3,
          orderBy: { createdAt: "desc" },
          select: { name: true, category: true, city: true, plan: true, trialStatus: true, slug: true },
        });

        if (latest.length === 0) {
          await sendTelegramMessage("Nessun salone registrato.");
        } else {
          let reply = "🆕 <b>Ultimi 3 saloni iscritti</b>\n\n";
          latest.forEach((tenant, index) => {
            reply +=
              `${index + 1}. <b>${escapeHtml(tenant.name)}</b>\n` +
              `Categoria: ${escapeHtml(tenant.category || "-")}\n` +
              `Città: ${escapeHtml(tenant.city || "-")}\n` +
              `Piano/stato: ${escapeHtml(tenant.plan)} / ${escapeHtml(tenant.trialStatus)}\n` +
              `${publicStoreUrl(tenant.slug)}\n\n`;
          });
          await sendTelegramMessage(reply);
        }
      } else if (text.startsWith("/cerca ")) {
        const query = text.replace("/cerca ", "").trim();
        if (query.length < 2) {
          await sendTelegramMessage("Inserisci almeno 2 lettere per cercare.");
        } else {
          const results = await prisma.tenant.findMany({
            where: { name: { contains: query, mode: "insensitive" } },
            take: 5,
            select: { id: true, name: true, phone: true, ownerEmail: true, city: true, slug: true, plan: true, trialStatus: true },
          });

          if (results.length === 0) {
            await sendTelegramMessage(`Nessun salone trovato per "<b>${escapeHtml(query)}</b>".`);
          } else {
            await sendTelegramMessage(`🔎 <b>Trovati ${results.length} risultati per "${escapeHtml(query)}"</b>`);
            for (const tenant of results) {
              let reply =
                `🏢 <b>${escapeHtml(tenant.name)}</b>\n` +
                `Città: ${escapeHtml(tenant.city || "-")}\n` +
                `Piano/stato: ${escapeHtml(tenant.plan)} / ${escapeHtml(tenant.trialStatus)}\n`;
              if (tenant.phone) reply += `Telefono: ${escapeHtml(tenant.phone)}\n`;
              if (tenant.ownerEmail) reply += `Email: ${escapeHtml(tenant.ownerEmail)}\n`;
              reply += `Link pubblico: ${publicStoreUrl(tenant.slug)}`;

              await sendTelegramMessage(reply, {
                inline_keyboard: [
                  [
                    { text: "Elimina spam", callback_data: `delete_${tenant.id}` },
                    { text: "Sospendi", callback_data: `suspend_${tenant.id}` },
                  ],
                ],
              });
            }
          }
        }
      } else if (text.startsWith("/entra ")) {
        const query = text.replace("/entra ", "").trim();
        if (query.length < 2) {
          await sendTelegramMessage("Inserisci almeno 2 lettere del salone.");
        } else {
          const tenant = await findTenantByName(query);
          if (!tenant) {
            await sendTelegramMessage(`Nessun salone trovato per "<b>${escapeHtml(query)}</b>".`);
          } else {
            const magicToken = createTenantSessionToken(tenant.slug, 60 * 15, tenant.sessionVersion);
            const magicLink = `https://${ROOT_DOMAIN}/api/telegram/magic?slug=${encodeURIComponent(tenant.slug)}&secret=${encodeURIComponent(magicToken)}`;
            await sendTelegramMessage(
              `🔐 <b>Link assistenza temporaneo</b>\n\n` +
              `Salone: <b>${escapeHtml(tenant.name)}</b>\n` +
              "Validità: 15 minuti\n" +
              "Uso: solo per assistenza autorizzata al cliente.\n\n" +
              `${magicLink}`
            );
          }
        }
      } else if (text.startsWith("/avvisa ")) {
        const message = text.replace("/avvisa ", "").trim();
        if (message.length < 5) {
          await sendTelegramMessage("Il messaggio deve essere più lungo.");
        } else {
          const tenants = await prisma.tenant.count({
            where: { ownerEmail: { not: null } },
          });
          await sendTelegramMessage(
            "📣 <b>Simulazione comunicazione</b>\n\n" +
            `Saloni con email: <b>${tenants}</b>\n` +
            "Nessuna email reale è stata inviata.\n\n" +
            `Testo simulato:\n<i>${escapeHtml(message)}</i>`
          );
        }
      } else if (text.startsWith("/pro ")) {
        const query = text.replace("/pro ", "").trim();
        const tenant = await findTenantByName(query);
        if (!tenant) {
          await sendTelegramMessage("Nessun salone trovato.");
        } else {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              plan: "pro",
              trialStatus: "converted",
              trialEndsAt: null,
              convertedAt: new Date(),
              emailVerified: true,
              emailVerifyToken: null,
              emailVerifyExpiresAt: null,
            },
          });
          const reward = await awardReferrerForConversion(tenant.id, "telegram");
          await sendTelegramMessage(
            `✅ <b>${escapeHtml(tenant.name)}</b> attivato manualmente su <b>Pro</b>.\n` +
            "Prezzo ufficiale: 29€/mese oppure 290€/anno.\n" +
            "Nessun addebito Stripe è stato creato da Telegram.\n" +
            (reward.rewarded
              ? `Referral: accreditati ${reward.credits} crediti a ${escapeHtml(reward.referrerName)}.`
              : "Referral: nessun nuovo accredito da assegnare.")
          );
        }
      } else if (text.startsWith("/basic ")) {
        const query = text.replace("/basic ", "").trim();
        const tenant = await findTenantByName(query);
        if (!tenant) {
          await sendTelegramMessage("Nessun salone trovato.");
        } else {
          const trialEnds = new Date();
          trialEnds.setDate(trialEnds.getDate() + 14);
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { plan: "basic", trialStatus: "trial_active", trialEndsAt: trialEnds },
          });
          await sendTelegramMessage(
            `🔒 <b>${escapeHtml(tenant.name)}</b> riportato al piano <b>Basic/trial</b>.\n` +
            "I dati del salone non sono stati cancellati."
          );
        }
      } else if (text.startsWith("/sms ")) {
        const parts = text.replace("/sms ", "").trim().split(/\s+/);
        if (parts.length !== 2) {
          await sendTelegramMessage("Formato errato. Usa: /sms [nome] [crediti]. Esempio: /sms beart 100");
        } else {
          const [query, amountText] = parts;
          const amount = parseInt(amountText, 10);
          if (!Number.isFinite(amount) || amount <= 0) {
            await sendTelegramMessage("Inserisci un numero di crediti valido. Esempio: /sms beart 100");
          } else {
            const tenant = await findTenantByName(query);
            if (!tenant) {
              await sendTelegramMessage("Nessun salone trovato con quel nome.");
            } else {
              const settings = await prisma.storeSettings.upsert({
                where: { tenantId: tenant.id },
                create: { tenantId: tenant.id, smsCredits: amount },
                update: { smsCredits: { increment: amount } },
              });
              await sendTelegramMessage(
                `✅ <b>${escapeHtml(tenant.name)}</b> ricaricato di <b>${amount}</b> crediti messaggio.\n` +
                `Saldo negozio: <b>${settings.smsCredits}</b> crediti.\n\n` +
                WHATSAPP_DISABLED_NOTE
              );
            }
          }
        }
      } else if (text.startsWith("/sedi ")) {
        const query = text.replace("/sedi ", "").trim();
        if (query.length < 2) {
          await sendTelegramMessage("Inserisci almeno 2 lettere del nome del salone.");
        } else {
          const tenant = await findTenantByName(query);
          if (!tenant) {
            await sendTelegramMessage(`Nessun salone trovato per "<b>${escapeHtml(query)}</b>".`);
          } else {
            const locations = await prisma.location.findMany({
              where: { tenantId: tenant.id },
              include: { settings: true },
              orderBy: { isMain: "desc" },
            });
            if (locations.length === 0) {
              await sendTelegramMessage(`<b>${escapeHtml(tenant.name)}</b>\nNessuna sede configurata.`);
            } else {
              let reply = `🏢 <b>${escapeHtml(tenant.name)}</b> — <b>${locations.length} sedi</b>\n\n`;
              for (const location of locations) {
                reply += `${location.isMain ? "⭐" : "📍"} <b>${escapeHtml(location.name)}</b> (slug: <code>${escapeHtml(location.slug)}</code>)\n`;
                if (location.address) reply += `Indirizzo: ${escapeHtml(location.address)}\n`;
                if (location.phone) reply += `Telefono: ${escapeHtml(location.phone)}\n`;
                if (location.openTime && location.closeTime) reply += `Orario base: ${escapeHtml(location.openTime)} - ${escapeHtml(location.closeTime)}\n`;
                reply += `Stato: ${location.isActive ? "attiva" : "disattiva"}\n`;
                reply += `Crediti sede: ${location.settings?.smsCredits ?? 0}\n\n`;
              }
              await sendTelegramMessage(reply);
            }
          }
        }
      } else if (text.startsWith("/sms-sede ")) {
        const parts = text.replace("/sms-sede ", "").trim().split(/\s+/);
        if (parts.length !== 3) {
          await sendTelegramMessage("Formato errato. Usa: /sms-sede [nome] [slug-sede] [crediti]. Esempio: /sms-sede beart principale 100");
        } else {
          const [query, slug, amountText] = parts;
          const amount = parseInt(amountText, 10);
          if (!Number.isFinite(amount) || amount <= 0) {
            await sendTelegramMessage("Inserisci un numero di crediti valido. Esempio: /sms-sede beart principale 100");
          } else {
            const tenant = await findTenantByName(query);
            if (!tenant) {
              await sendTelegramMessage("Nessun salone trovato.");
            } else {
              const location = await prisma.location.findFirst({
                where: { tenantId: tenant.id, slug: { equals: slug, mode: "insensitive" } },
              });
              if (!location) {
                await sendTelegramMessage(`Sede "<b>${escapeHtml(slug)}</b>" non trovata per ${escapeHtml(tenant.name)}. Usa /sedi ${escapeHtml(query)} per vedere gli slug corretti.`);
              } else {
                const settings = await prisma.locationSettings.upsert({
                  where: { locationId: location.id },
                  create: { locationId: location.id, smsCredits: amount },
                  update: { smsCredits: { increment: amount } },
                });
                await sendTelegramMessage(
                  `✅ <b>${escapeHtml(tenant.name)}</b> — sede <b>${escapeHtml(location.name)}</b> ricaricata di <b>${amount}</b> crediti messaggio.\n` +
                  `Saldo sede: <b>${settings.smsCredits}</b> crediti.\n\n` +
                  WHATSAPP_DISABLED_NOTE
                );
              }
            }
          }
        }
      } else if (text.startsWith("/nuova-sede ")) {
        const parts = text.replace("/nuova-sede ", "").trim().split(/\s+/);
        if (parts.length < 2) {
          await sendTelegramMessage("Formato errato. Usa: /nuova-sede [nome] [slug] [telefono?]. Esempio: /nuova-sede beart centro +393331234567");
        } else {
          const query = parts[0];
          const slug = parts[1].toLowerCase().replace(/[^a-z0-9-]/g, "");
          const phone = parts.slice(2).join(" ") || undefined;
          if (slug.length < 2) {
            await sendTelegramMessage("Slug non valido. Usa almeno 2 caratteri: lettere, numeri e trattini.");
          } else {
            const tenant = await findTenantByName(query);
            if (!tenant) {
              await sendTelegramMessage("Nessun salone trovato.");
            } else {
              const existing = await prisma.location.findFirst({ where: { tenantId: tenant.id, slug } });
              if (existing) {
                await sendTelegramMessage(`Slug "<b>${escapeHtml(slug)}</b>" già esistente per ${escapeHtml(tenant.name)}.`);
              } else {
                const location = await prisma.location.create({
                  data: {
                    name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
                    slug,
                    phone,
                    tenantId: tenant.id,
                  },
                });
                await prisma.locationSettings.create({ data: { locationId: location.id } });
                const services = await prisma.service.findMany({ where: { tenantId: tenant.id } });
                if (services.length > 0) {
                  await prisma.serviceLocation.createMany({
                    data: services.map((service) => ({
                      serviceId: service.id,
                      locationId: location.id,
                      price: service.price,
                    })),
                  });
                }
                await sendTelegramMessage(
                  `✅ <b>${escapeHtml(tenant.name)}</b> — nuova sede creata.\n` +
                  `Sede: <b>${escapeHtml(location.name)}</b>\n` +
                  `Slug: <code>${escapeHtml(slug)}</code>\n` +
                  `Telefono: ${escapeHtml(phone || "non specificato")}\n` +
                  `Servizi collegati: ${services.length}`
                );
              }
            }
          }
        }
      } else if (text === "/agents") {
        let totalLeads = 0;
        let newLeads = 0;
        try { totalLeads = await prisma.lead.count(); } catch {}
        try { newLeads = await prisma.lead.count({ where: { status: "new" } }); } catch {}
        const activeTrials = await prisma.tenant.count({
          where: { trialStatus: { in: ["trial_active", "demo", "published", "active"] }, plan: { notIn: ["pro", "elite"] } },
        });
        const paying = await prisma.tenant.count({ where: { trialStatus: "converted" } });
        const expired = await prisma.tenant.count({ where: { trialStatus: "expired" } });
        await sendTelegramMessage(
          "🤖 <b>Stato agenti NeatX</b>\n\n" +
          `Lead: <b>${totalLeads}</b> totali, <b>${newLeads}</b> nuovi\n` +
          `Tenant: <b>${activeTrials}</b> trial, <b>${paying}</b> paganti, <b>${expired}</b> scaduti\n\n` +
          "Usa /agent run per avviare gli agenti automatici."
        );
      } else if (text === "/lead") {
        try {
          const leads = await prisma.lead.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            select: { name: true, source: true, status: true },
          });

          if (leads.length === 0) {
            await sendTelegramMessage("Nessun lead trovato nella pipeline.");
          } else {
            let reply = "🎯 <b>Ultimi 5 contatti raccolti</b>\n\n";
            leads.forEach((lead, index) => {
              reply += `${index + 1}. <b>${escapeHtml(lead.name)}</b>\nFonte: ${escapeHtml(lead.source)}\nStato: ${escapeHtml(lead.status)}\n\n`;
            });
            await sendTelegramMessage(reply);
          }
        } catch {
          await sendTelegramMessage("Errore durante la lettura dei lead.");
        }
      } else if (text === "/agent run") {
        try {
          const token = process.env.GITHUB_TOKEN || process.env.GH_PAT;
          if (!token) {
            await sendTelegramMessage("GITHUB_TOKEN non configurato. Imposta la variabile d'ambiente prima di avviare gli agenti.");
          } else {
            const res = await fetch("https://api.github.com/repos/neatxinfo-db/DemoNeatXApp/actions/workflows/auto-neatx-agents.yml/dispatches", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ ref: "main" }),
            });
            if (res.ok) {
              await sendTelegramMessage("Agenti avviati su GitHub Actions. Controlla il risultato tra qualche minuto.");
            } else {
              await sendTelegramMessage(`GitHub Actions non ha avviato gli agenti. Stato risposta: ${res.status}.`);
            }
          }
        } catch {
          await sendTelegramMessage("Errore durante l'avvio degli agenti.");
        }
      } else if (text === "/aiuto") {
        await sendTelegramMessage(helpMessage());
      } else if (text === "/start") {
        await sendTelegramMessage("NeatX Admin pronto. Scrivi /aiuto per vedere i comandi disponibili.");
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Errore Webhook Telegram:", error);
    return NextResponse.json({ ok: true });
  }
}
