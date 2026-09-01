import { pathToFileURL } from "node:url";

const DEFAULT_NEATX_BASE_URL = "https://www.neatx.store";
const REQUEST_TIMEOUT_MS = 45_000;
const PAUSE_BETWEEN_MESSAGES_MS = 2_000;

function requiredEnv(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Configurazione mancante: ${name}`);
  return value;
}

export function normalizeItalianPhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) throw new Error("Numero destinatario mancante");
  return digits.startsWith("39") ? digits : `39${digits}`;
}

function validateDate(date) {
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Data non valida: usare YYYY-MM-DD");
  }
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 500) };
  }
}

async function requestJson(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data = await readJson(response);
  return { response, data };
}

function neatxHeaders(cronSecret) {
  return {
    Authorization: `Bearer ${cronSecret}`,
    "Content-Type": "application/json",
  };
}

function openWaHeaders(apiKey) {
  return {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
  };
}

function providerResult(response, data) {
  const providerMessageId = data.messageId || data.message_id || data.id;
  const providerError =
    data.error ||
    (data.success === false ? data.message || "OpenWA ha rifiutato il messaggio" : null) ||
    (!response.ok ? data.message || `OpenWA HTTP ${response.status}` : null) ||
    (!providerMessageId ? "OpenWA non ha restituito un messageId" : null);

  return {
    outcome: providerError ? "failed" : "sent",
    providerMessageId: providerMessageId ? String(providerMessageId) : undefined,
    error: providerError ? String(providerError) : undefined,
  };
}

async function settleDelivery({ fetchImpl, neatxBaseUrl, cronSecret, reminder, result }) {
  const { response, data } = await requestJson(
    fetchImpl,
    `${neatxBaseUrl}/api/reminders/delivery`,
    {
      method: "POST",
      headers: neatxHeaders(cronSecret),
      body: JSON.stringify({
        deliveryId: reminder.deliveryId,
        leaseToken: reminder.leaseToken,
        outcome: result.outcome,
        providerMessageId: result.providerMessageId,
        error: result.error,
      }),
    },
  );

  if (!response.ok || data.success !== true) {
    throw new Error(`Registrazione consegna fallita (HTTP ${response.status})`);
  }
}

export async function checkConnections({ env = process.env, fetchImpl = fetch, log = console }) {
  const neatxBaseUrl = (env.NEATX_BASE_URL || DEFAULT_NEATX_BASE_URL).replace(/\/+$/, "");
  const openWaBaseUrl = requiredEnv(env, "OPENWA_BASE_URL").replace(/\/+$/, "");
  const openWaApiKey = requiredEnv(env, "OPENWA_API_KEY");
  const openWaSessionId = requiredEnv(env, "OPENWA_SESSION_ID");
  requiredEnv(env, "NEATX_REMINDER_TOKEN");

  const health = await requestJson(fetchImpl, `${neatxBaseUrl}/api/keepalive`);
  if (!health.response.ok) {
    throw new Error(`NeatX non raggiungibile (HTTP ${health.response.status})`);
  }

  const session = await requestJson(
    fetchImpl,
    `${openWaBaseUrl}/api/sessions/${encodeURIComponent(openWaSessionId)}`,
    { headers: openWaHeaders(openWaApiKey) },
  );
  if (!session.response.ok) {
    throw new Error(`OpenWA non raggiungibile (HTTP ${session.response.status})`);
  }
  if (session.data.status !== "ready" || session.data.engineLoaded === false) {
    throw new Error(`Sessione OpenWA non pronta: ${session.data.status || "stato sconosciuto"}`);
  }

  log.log("Controllo completato: NeatX raggiungibile e sessione WhatsApp pronta.");
  return { neatx: "ready", openwa: "ready" };
}

export async function dispatchReminders({
  env = process.env,
  fetchImpl = fetch,
  log = console,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  const neatxBaseUrl = (env.NEATX_BASE_URL || DEFAULT_NEATX_BASE_URL).replace(/\/+$/, "");
  const openWaBaseUrl = requiredEnv(env, "OPENWA_BASE_URL").replace(/\/+$/, "");
  const openWaApiKey = requiredEnv(env, "OPENWA_API_KEY");
  const openWaSessionId = requiredEnv(env, "OPENWA_SESSION_ID");
  const cronSecret = requiredEnv(env, "NEATX_REMINDER_TOKEN");
  const requestedDate = env.REQUESTED_DATE?.trim() || "";
  validateDate(requestedDate);

  const queueBody = { limit: 2000 };
  if (requestedDate) queueBody.date = requestedDate;

  const queue = await requestJson(fetchImpl, `${neatxBaseUrl}/api/reminders/queue`, {
    method: "POST",
    headers: neatxHeaders(cronSecret),
    body: JSON.stringify(queueBody),
  });
  if (!queue.response.ok) {
    throw new Error(`Lettura coda fallita (HTTP ${queue.response.status})`);
  }

  const reminders = Array.isArray(queue.data.reminders) ? queue.data.reminders : [];
  const date = queue.data.date || requestedDate || undefined;
  log.log(`Coda ${date || "di domani"}: ${reminders.length} promemoria da elaborare.`);

  let sent = 0;
  let failed = 0;
  const errors = [];

  for (let index = 0; index < reminders.length; index += 1) {
    const reminder = reminders[index];
    let result;

    if (!reminder.deliveryId || !reminder.leaseToken || !reminder.message) {
      result = { outcome: "failed", error: "Dati del promemoria incompleti" };
    } else {
      try {
        const chatId = `${normalizeItalianPhone(reminder.phone)}@c.us`;
        const provider = await requestJson(
          fetchImpl,
          `${openWaBaseUrl}/api/sessions/${encodeURIComponent(openWaSessionId)}/messages/send-text`,
          {
            method: "POST",
            headers: openWaHeaders(openWaApiKey),
            body: JSON.stringify({ chatId, text: reminder.message }),
          },
        );
        result = providerResult(provider.response, provider.data);
      } catch (error) {
        result = {
          outcome: "failed",
          error: error instanceof Error ? error.message : "Errore OpenWA",
        };
      }
    }

    await settleDelivery({ fetchImpl, neatxBaseUrl, cronSecret, reminder, result });

    if (result.outcome === "sent") {
      sent += 1;
    } else {
      failed += 1;
      errors.push(result.error || "Invio non riuscito");
    }

    if (index < reminders.length - 1) await sleep(PAUSE_BETWEEN_MESSAGES_MS);
  }

  // Anche una coda vuota deve produrre un riepilogo: conferma che il giro è
  // partito davvero e distingue zero appuntamenti da cron mai eseguito.
  if (date) {
    const summary = await requestJson(fetchImpl, `${neatxBaseUrl}/api/reminders/summary`, {
      method: "POST",
      headers: neatxHeaders(cronSecret),
      body: JSON.stringify({
        date,
        skippedNoCreditsByTenant: queue.data.skippedNoCreditsByTenant,
      }),
    });
    if (!summary.response.ok) {
      throw new Error(`Riepilogo finale fallito (HTTP ${summary.response.status})`);
    }
  }

  log.log(`Operazione conclusa: ${sent} inviati, ${failed} falliti.`);
  if (failed > 0) {
    throw new Error(`${failed} promemoria non inviati: ${errors.join("; ")}`);
  }

  return { date, queued: reminders.length, sent, failed };
}

async function main() {
  if (process.argv.includes("--check")) {
    await checkConnections({});
    return;
  }
  await dispatchReminders({});
}

const executedDirectly = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (executedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
