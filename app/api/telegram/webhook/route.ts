import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";
import { createTenantSessionToken } from "@/lib/auth";
import { getTelegramWebhookSecret } from "@/lib/telegram-auth";
import { awardReferrerForConversion } from "@/lib/referral";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store";
const WHATSAPP_ACTIVE_NOTE =
  "🔔 Promemoria WhatsApp: attivi per negozi paganti o in prova, inviati dal numero centrale NeatX. Il messaggio scala 1 credito; se il saldo del negozio è a zero, il promemoria viene saltato.";

const GITHUB_REPOSITORY = "lore-bisceglie/DemoNeatXApp";

type TelegramAction = {
  id: string;
  workflow: string;
  label: string;
  description: string;
  group: "ops" | "growth" | "publish";
  inputs?: Record<string, string>;
};

const TELEGRAM_ACTIONS: TelegramAction[] = [
  {
    id: "agents",
    workflow: "auto-neatx-agents.yml",
    label: "Agenti NeatX",
    description: "Aggiorna gli agenti e la loro lavagna operativa.",
    group: "ops",
  },
  {
    id: "health",
    workflow: "auto-build-health.yml",
    label: "Controllo salute sito",
    description: "Esegue lint, build e controllo del sito in produzione.",
    group: "ops",
  },
  {
    id: "report",
    workflow: "auto-daily-report.yml",
    label: "Report giornaliero",
    description: "Genera subito il riepilogo Telegram della giornata.",
    group: "ops",
  },
  {
    id: "reminders-check",
    workflow: "reminders-dispatch.yml",
    label: "Controlla promemoria",
    description: "Verifica coda e collegamenti senza inviare WhatsApp.",
    group: "ops",
    inputs: { mode: "check" },
  },
  {
    id: "calendar",
    workflow: "auto-content-calendar.yml",
    label: "Calendario contenuti",
    description: "Aggiorna il calendario e la strategia editoriale.",
    group: "growth",
  },
  {
    id: "radar",
    workflow: "auto-viral-radar.yml",
    label: "Radar virale",
    description: "Cerca e registra idee e trend da usare nei contenuti.",
    group: "growth",
  },
  {
    id: "competitors",
    workflow: "auto-competitor-spy.yml",
    label: "Analizza concorrenti",
    description: "Aggiorna il monitoraggio dei concorrenti.",
    group: "growth",
  },
  {
    id: "leads",
    workflow: "auto-lead-pipeline.yml",
    label: "Pipeline lead",
    description: "Aggiorna la pipeline commerciale e le priorità.",
    group: "growth",
  },
  {
    id: "seo",
    workflow: "auto-seo.yml",
    label: "SEO blog",
    description: "Genera e pubblica un nuovo contenuto SEO quando previsto.",
    group: "growth",
  },
  {
    id: "post",
    workflow: "auto-post.yml",
    label: "Pubblica post",
    description: "Può pubblicare un contenuto sui canali collegati.",
    group: "publish",
  },
  {
    id: "reel",
    workflow: "auto-reel.yml",
    label: "Crea Reel",
    description: "Genera il Reel e può eseguire le azioni social previste.",
    group: "publish",
  },
];

const ACTION_GROUPS = {
  ops: { title: "🛠️ <b>Gestione e controlli</b>", button: "🛠️ Gestione e controlli" },
  growth: { title: "📈 <b>Crescita e contenuti</b>", button: "📈 Crescita e contenuti" },
  publish: { title: "📣 <b>Pubblicazione</b>", button: "📣 Pubblicazione" },
} as const;

const ACTION_COMMANDS: Record<string, string> = {
  "/agenti": "agents",
  "/controllo": "health",
  "/report": "report",
  "/promemoria": "reminders-check",
  "/calendario": "calendar",
  "/radar": "radar",
  "/concorrenti": "competitors",
  "/pipeline": "leads",
  "/seo": "seo",
  "/post": "post",
  "/reel": "reel",
};

function getTelegramCommands() {
  return [
    { command: "azioni", description: "Apri tutte le Actions" },
    { command: "agenti", description: "Avvia gli agenti NeatX" },
    { command: "controllo", description: "Controlla salute e build sito" },
    { command: "report", description: "Genera il report giornaliero" },
    { command: "promemoria", description: "Controlla coda promemoria" },
    { command: "calendario", description: "Aggiorna calendario contenuti" },
    { command: "radar", description: "Avvia il radar virale" },
    { command: "concorrenti", description: "Analizza i concorrenti" },
    { command: "pipeline", description: "Aggiorna pipeline lead" },
    { command: "seo", description: "Avvia SEO blog" },
    { command: "post", description: "Prepara/pubblica un post" },
    { command: "reel", description: "Crea un Reel" },
    { command: "stats", description: "Statistiche NeatX" },
    { command: "ultimi", description: "Ultimi 3 negozi iscritti" },
    { command: "cerca", description: "Cerca un negozio" },
    { command: "entra", description: "Crea login assistenza" },
    { command: "agents", description: "Stato agenti AI" },
    { command: "lead", description: "Ultimi contatti ricevuti" },
    { command: "aiuto", description: "Guida ai comandi" },
  ];
}

function actionsHomeKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: ACTION_GROUPS.ops.button, callback_data: "actions:group:ops" },
        { text: ACTION_GROUPS.growth.button, callback_data: "actions:group:growth" },
      ],
      [{ text: ACTION_GROUPS.publish.button, callback_data: "actions:group:publish" }],
    ],
  };
}

function actionsGroupKeyboard(group: TelegramAction["group"]) {
  return {
    inline_keyboard: [
      ...TELEGRAM_ACTIONS.filter((action) => action.group === group).map((action) => [
        { text: `▶️ ${action.label}`, callback_data: `actions:confirm:${action.id}` },
      ]),
      [{ text: "← Tutte le Actions", callback_data: "actions:home" }],
    ],
  };
}

function actionsHomeText() {
  return (
    "🎛️ <b>NeatX Actions</b>\n\n" +
    "Scegli un'area. Ogni avvio richiede una seconda conferma: le Actions che pubblicano contenuti non partono per errore."
  );
}

function findAction(id: string) {
  return TELEGRAM_ACTIONS.find((action) => action.id === id);
}

function actionConfirmationText(action: TelegramAction) {
  return (
    `⚠️ <b>Conferma avvio</b>\n\n` +
    `<b>${escapeHtml(action.label)}</b>\n${escapeHtml(action.description)}\n\n` +
    "Vuoi avviarla ora su GitHub Actions?"
  );
}

function actionConfirmationKeyboard(action: TelegramAction) {
  return {
    inline_keyboard: [
      [{ text: "✅ Avvia ora", callback_data: `actions:run:${action.id}` }],
      [{ text: "← Indietro", callback_data: `actions:group:${action.group}` }],
    ],
  };
}

async function refreshTelegramCommands() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands: getTelegramCommands() }),
    });
  } catch (error) {
    console.error("[Telegram] Impossibile aggiornare il menu comandi:", error);
  }
}

async function dispatchGitHubAction(action: TelegramAction) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_PAT;
  if (!token) return { ok: false, reason: "GITHUB_TOKEN non configurato." };

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/workflows/${encodeURIComponent(action.workflow)}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ ref: "main", inputs: action.inputs || {} }),
      }
    );

    if (response.ok) return { ok: true };
    console.error(`[Telegram] GitHub Action ${action.workflow} non avviata:`, response.status);
    return { ok: false, reason: `GitHub ha risposto ${response.status}.` };
  } catch (error) {
    console.error(`[Telegram] Errore avvio Action ${action.workflow}:`, error);
    return { ok: false, reason: "Errore di collegamento con GitHub." };
  }
}

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
    where: { name: { contains: query } },
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

async function editMessageText(chatId: string, messageId: number, text: string, replyMarkup?: any) {
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
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
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
    "/azioni - Pannello per avviare le GitHub Actions\n" +
    "/agent run - Avvia direttamente gli agenti su GitHub Actions\n" +
    "/aiuto - Mostra questa guida\n\n" +
    `ℹ️ ${WHATSAPP_ACTIVE_NOTE}`
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
      } else if (data === "actions:home") {
        await answerCallbackQuery(cb.id);
        await editMessageText(chatId, messageId, actionsHomeText(), actionsHomeKeyboard());
      } else if (data.startsWith("actions:group:")) {
        const group = data.replace("actions:group:", "") as TelegramAction["group"];
        if (!(group in ACTION_GROUPS)) {
          await answerCallbackQuery(cb.id, "Azione non valida.");
        } else {
          await answerCallbackQuery(cb.id);
          await editMessageText(
            chatId,
            messageId,
            `${ACTION_GROUPS[group].title}\n\nScegli cosa avviare. Prima dell'esecuzione ti chiederò conferma.`,
            actionsGroupKeyboard(group)
          );
        }
      } else if (data.startsWith("actions:confirm:")) {
        const action = findAction(data.replace("actions:confirm:", ""));
        if (!action) {
          await answerCallbackQuery(cb.id, "Azione non valida.");
        } else {
          await answerCallbackQuery(cb.id);
          await editMessageText(
            chatId,
            messageId,
            actionConfirmationText(action),
            actionConfirmationKeyboard(action)
          );
        }
      } else if (data.startsWith("actions:run:")) {
        const action = findAction(data.replace("actions:run:", ""));
        if (!action) {
          await answerCallbackQuery(cb.id, "Azione non valida.");
        } else {
          await answerCallbackQuery(cb.id, "Avvio in corso...");
          await editMessageText(
            chatId,
            messageId,
            `⏳ <b>${escapeHtml(action.label)}</b> in avvio...`,
            { inline_keyboard: [] }
          );
          const result = await dispatchGitHubAction(action);
          if (result.ok) {
            await editMessageText(
              chatId,
              messageId,
              `✅ <b>${escapeHtml(action.label)}</b> avviata.\n\n` +
                "GitHub Actions sta lavorando: riceverai il riepilogo automatico quando l'azione termina.",
              { inline_keyboard: [[{ text: "← Torna alle Actions", callback_data: "actions:home" }]] }
            );
          } else {
            await editMessageText(
              chatId,
              messageId,
              `❌ <b>${escapeHtml(action.label)}</b> non è partita.\n\n${escapeHtml(result.reason || "Errore sconosciuto.")}`,
              {
                inline_keyboard: [
                  [{ text: "↻ Riprova", callback_data: `actions:run:${action.id}` }],
                  [{ text: "← Torna alle Actions", callback_data: "actions:home" }],
                ],
              }
            );
          }
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

      await refreshTelegramCommands();
      const action = findAction(ACTION_COMMANDS[text] || "");

      if (action) {
        await sendTelegramMessage(actionConfirmationText(action), actionConfirmationKeyboard(action));
      } else if (text === "/azioni" || text === "/actions") {
        await sendTelegramMessage(actionsHomeText(), actionsHomeKeyboard());
      } else if (text === "/stats") {
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
            where: { name: { contains: query } },
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
                WHATSAPP_ACTIVE_NOTE
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
                where: { tenantId: tenant.id, slug },
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
                  WHATSAPP_ACTIVE_NOTE
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
        const action = findAction("agents");
        if (!action) {
          await sendTelegramMessage("Azione agenti non configurata.");
        } else {
          const result = await dispatchGitHubAction(action);
          await sendTelegramMessage(
            result.ok
              ? "✅ Agenti avviati su GitHub Actions. Riceverai il riepilogo automatico al termine."
              : `❌ Agenti non avviati. ${escapeHtml(result.reason || "Errore sconosciuto.")}`
          );
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
