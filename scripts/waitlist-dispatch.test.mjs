import assert from "node:assert/strict";
import test from "node:test";
import { checkWaitlist, dispatchWaitlist } from "./waitlist-dispatch.mjs";

function response(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const silentLog = { log() {} };

test("check mode only checks keepalive", async () => {
  const calls = [];
  const result = await checkWaitlist({
    env: { NEATX_AUTOMATION_TOKEN: "secret", NEATX_BASE_URL: "https://example.test" },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return response(200, { ok: true });
    },
    log: silentLog,
  });

  assert.deepEqual(result, { success: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://example.test/api/keepalive");
  assert.equal(calls[0].options?.method, undefined);
});

test("dispatch calls the protected endpoint and reports the result", async () => {
  const calls = [];
  const result = await dispatchWaitlist({
    env: { NEATX_AUTOMATION_TOKEN: "secret", NEATX_BASE_URL: "https://example.test/" },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return response(200, { success: true, promoted: 1, claimed: 1, sent: 1, failed: 0 });
    },
    log: silentLog,
  });

  assert.deepEqual(result, { mode: "active", promoted: 1, claimed: 1, sent: 1, failed: 0 });
  assert.equal(calls[0].url, "https://example.test/api/waitlist/dispatch");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.Authorization, "Bearer secret");
  assert.deepEqual(JSON.parse(calls[0].options.body), { limit: 20 });
});

test("dispatch fails visibly when NeatX rejects the request", async () => {
  await assert.rejects(
    dispatchWaitlist({
      env: { NEATX_AUTOMATION_TOKEN: "wrong" },
      fetchImpl: async () => response(404, { error: "Not found" }),
      log: silentLog,
    }),
    /Not found/,
  );
});

test("dispatch fails visibly when a notification fails", async () => {
  await assert.rejects(
    dispatchWaitlist({
      env: { NEATX_AUTOMATION_TOKEN: "secret" },
      fetchImpl: async () =>
        response(200, { success: true, promoted: 1, claimed: 1, sent: 0, failed: 1 }),
      log: silentLog,
    }),
    /1 notifiche/,
  );
});

test("dispatch fails visibly when WhatsApp notifications are disabled", async () => {
  await assert.rejects(
    dispatchWaitlist({
      env: { NEATX_AUTOMATION_TOKEN: "secret" },
      fetchImpl: async () => response(200, { success: true, mode: "disabled", sent: 0, failed: 0 }),
      log: silentLog,
    }),
    /disattivate/,
  );
});
