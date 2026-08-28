import assert from "node:assert/strict";
import test from "node:test";

import {
  checkConnections,
  dispatchReminders,
  normalizeItalianPhone,
} from "./reminders-dispatch.mjs";

const env = {
  NEATX_BASE_URL: "https://neatx.test",
  NEATX_REMINDER_TOKEN: "reminder-secret",
  OPENWA_BASE_URL: "https://openwa.test",
  OPENWA_API_KEY: "openwa-secret",
  OPENWA_SESSION_ID: "session-id",
  REQUESTED_DATE: "2026-08-30",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("normalizza i numeri italiani", () => {
  assert.equal(normalizeItalianPhone("333 123 4567"), "393331234567");
  assert.equal(normalizeItalianPhone("+39 333 123 4567"), "393331234567");
});

test("il controllo connessioni non legge la coda e non invia messaggi", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith("/api/keepalive")) return jsonResponse({ status: "ok" });
    return jsonResponse({ status: "ready", engineLoaded: true });
  };

  const result = await checkConnections({ env, fetchImpl, log: { log() {} } });
  assert.deepEqual(result, { neatx: "ready", openwa: "ready" });
  assert.equal(calls.length, 2);
  assert.equal(calls.some((url) => url.includes("/api/reminders/queue")), false);
});

test("invia, registra la consegna e crea il riepilogo", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const path = new URL(url).pathname;
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ path, body });

    if (path.endsWith("/api/reminders/queue")) {
      return jsonResponse({
        date: "2026-08-30",
        reminders: [{
          deliveryId: "delivery-1",
          leaseToken: "lease-1",
          phone: "3331234567",
          message: "Promemoria test",
        }],
      });
    }
    if (path.endsWith("/messages/send-text")) {
      return jsonResponse({ messageId: "message-1" }, 201);
    }
    if (path.endsWith("/api/reminders/delivery")) {
      return jsonResponse({ success: true, alreadySettled: false });
    }
    if (path.endsWith("/api/reminders/summary")) {
      return jsonResponse({ success: true });
    }
    throw new Error(`Chiamata inattesa: ${path}`);
  };

  const result = await dispatchReminders({
    env,
    fetchImpl,
    log: { log() {} },
    sleep: async () => {},
  });

  assert.deepEqual(result, {
    date: "2026-08-30",
    queued: 1,
    sent: 1,
    failed: 0,
  });
  assert.equal(calls[1].body.chatId, "393331234567@c.us");
  assert.equal(calls[2].body.outcome, "sent");
  assert.equal(calls[2].body.providerMessageId, "message-1");
  assert.equal(calls.at(-1).path.endsWith("/api/reminders/summary"), true);
});

test("un rifiuto OpenWA viene registrato come fallimento", async () => {
  const settlements = [];
  const fetchImpl = async (url, options = {}) => {
    const path = new URL(url).pathname;
    const body = options.body ? JSON.parse(options.body) : null;
    if (path.endsWith("/api/reminders/queue")) {
      return jsonResponse({
        date: "2026-08-30",
        reminders: [{
          deliveryId: "delivery-2",
          leaseToken: "lease-2",
          phone: "3331234567",
          message: "Promemoria test",
        }],
      });
    }
    if (path.endsWith("/messages/send-text")) {
      return jsonResponse({ error: "provider offline" }, 503);
    }
    if (path.endsWith("/api/reminders/delivery")) {
      settlements.push(body);
      return jsonResponse({ success: true });
    }
    if (path.endsWith("/api/reminders/summary")) return jsonResponse({ success: true });
    throw new Error(`Chiamata inattesa: ${path}`);
  };

  await assert.rejects(
    dispatchReminders({ env, fetchImpl, log: { log() {} }, sleep: async () => {} }),
    /1 promemoria non inviati/,
  );
  assert.equal(settlements[0].outcome, "failed");
  assert.match(settlements[0].error, /provider offline/);
});
