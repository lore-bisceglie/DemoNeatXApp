import nextEnv from "@next/env";
import Stripe from "stripe";
import { readFile } from "node:fs/promises";

const envFile = process.argv[2];
const expectedMode = process.argv[3] || "test";
if (envFile) {
  const text = await readFile(envFile, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).replace(/\\n/g, "\n");
    }
    process.env[match[1]] = value;
  }
} else {
  nextEnv.loadEnvConfig(process.cwd());
}
const secret = process.env.STRIPE_SECRET_KEY || "";
const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const classify = (value, variants) => variants.find((variant) => value.startsWith(variant)) || "other";
if (expectedMode === "inspect") {
  console.log(JSON.stringify({
    secretKind: classify(secret, ["sk_test_", "sk_live_", "rk_test_", "rk_live_"]),
    publishableKind: classify(publishable, ["pk_test_", "pk_live_"]),
    webhookKind: classify(process.env.STRIPE_WEBHOOK_SECRET || "", ["whsec_"]),
    secretPresent: Boolean(secret),
    publishablePresent: Boolean(publishable),
  }, null, 2));
  process.exit(0);
}
if (!secret.startsWith(`sk_${expectedMode}_`)) throw new Error(`STRIPE_SECRET_KEY non è in modalità ${expectedMode}`);
if (!publishable.startsWith(`pk_${expectedMode}_`)) throw new Error(`La chiave pubblicabile Stripe non è in modalità ${expectedMode}`);
const webhookSecretFormatValid = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_"));

const stripe = new Stripe(secret);
const [balance, account] = await Promise.all([
  stripe.balance.retrieve(),
  stripe.accounts.retrieve(),
]);

console.log(JSON.stringify({
  secretMode: expectedMode,
  publishableMode: expectedMode,
  balanceLivemode: balance.livemode,
  accountChargesEnabled: account.charges_enabled,
  accountPayoutsEnabled: account.payouts_enabled,
  webhookSecretConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  webhookSecretFormatValid,
}, null, 2));
