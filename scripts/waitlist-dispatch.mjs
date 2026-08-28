import { pathToFileURL } from "node:url";

const DEFAULT_NEATX_BASE_URL = "https://www.neatx.store";
const REQUEST_TIMEOUT_MS = 60_000;

function requiredEnv(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Configurazione mancante: ${name}`);
  return value;
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
  return { response, data: await readJson(response) };
}

export async function checkWaitlist({ env = process.env, fetchImpl = fetch, log = console }) {
  const neatxBaseUrl = (env.NEATX_BASE_URL || DEFAULT_NEATX_BASE_URL).replace(/\/+$/, "");
  requiredEnv(env, "NEATX_AUTOMATION_TOKEN");

  const { response } = await requestJson(fetchImpl, `${neatxBaseUrl}/api/keepalive`);
  if (!response.ok) throw new Error(`NeatX non raggiungibile (HTTP ${response.status})`);

  log.log("Controllo lista d'attesa riuscito: NeatX è raggiungibile e il token è configurato.");
  return { success: true };
}

export async function dispatchWaitlist({ env = process.env, fetchImpl = fetch, log = console }) {
  const neatxBaseUrl = (env.NEATX_BASE_URL || DEFAULT_NEATX_BASE_URL).replace(/\/+$/, "");
  const token = requiredEnv(env, "NEATX_AUTOMATION_TOKEN");

  const { response, data } = await requestJson(
    fetchImpl,
    `${neatxBaseUrl}/api/waitlist/dispatch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit: 20 }),
    },
  );

  if (!response.ok || data.success !== true) {
    const detail = data.error || data.raw || `HTTP ${response.status}`;
    throw new Error(`Controllo lista d'attesa fallito: ${detail}`);
  }

  if (data.mode === "disabled") {
    throw new Error("Le notifiche WhatsApp risultano disattivate su NeatX");
  }

  const result = {
    mode: data.mode || "active",
    promoted: Number(data.promoted || 0),
    claimed: Number(data.claimed || 0),
    sent: Number(data.sent || 0),
    failed: Number(data.failed || 0),
  };

  log.log(
    `Lista d'attesa: ${result.promoted} promossi, ${result.claimed} elaborati, ${result.sent} inviati, ${result.failed} falliti.`,
  );

  if (result.failed > 0) {
    throw new Error(`${result.failed} notifiche della lista d'attesa non sono state inviate`);
  }

  return result;
}

async function main() {
  if (process.argv.includes("--check")) {
    await checkWaitlist({});
    return;
  }
  await dispatchWaitlist({});
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
