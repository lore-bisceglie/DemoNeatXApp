import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const base = "https://www.neatx.store";

try {
  const tenant = await prisma.tenant.findFirst({ select: { id: true } });
  assert.ok(tenant, "Serve almeno un tenant per il test IDOR negativo");

  const checks = [
    ["tenant staff senza sessione", `/api/staff?tenantId=${encodeURIComponent(tenant.id)}`, {}, 401],
    ["marketing senza sessione", `/api/marketing/dormant?tenantId=${encodeURIComponent(tenant.id)}`, {}, 401],
    ["cron senza secret", "/api/cron/reminders", {}, 401],
    ["Telegram senza secret", "/api/telegram/webhook", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }, 401],
    ["Stripe senza firma", "/api/stripe/webhook", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }, 400],
    ["verifica email incompleta", "/api/verify-email?token=invalid", {}, 400],
    ["ricarica senza sessione", "/api/checkout/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tenantId: tenant.id, packageId: "small" }),
    }, 401],
  ];

  const results = [];
  for (const [name, path, options, expected] of checks) {
    const response = await fetch(`${base}${path}`, { redirect: "manual", ...options });
    results.push({ name, status: response.status, expected });
    assert.equal(response.status, expected, `${name}: atteso ${expected}, ricevuto ${response.status}`);
  }
  console.log(JSON.stringify(results, null, 2));
} finally {
  await prisma.$disconnect();
}
