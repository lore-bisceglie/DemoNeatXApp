const sid = "ACcf6aa41e2e64203e1fc7b23fe9d51c1d";
const token = "65c68f6d4e2eb7175aa07544a82fb9ea";
const auth = Buffer.from(`${sid}:${token}`).toString("base64");

async function main() {
  // 1. Controlla numeri WhatsApp abilitati
  console.log("1. Numeri associati all'account:");
  const nums = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json`, {
    headers: { Authorization: `Basic ${auth}` },
  }).then(r => r.json());

  for (const n of (nums.incoming_phone_numbers || [])) {
    console.log(`   ${n.phone_number} - capabilities:`, JSON.stringify(n.capabilities));
  }

  // 2. Controlla Content Templates (WhatsApp)
  console.log("\n2. WhatsApp Content Templates:");
  const ct = await fetch(`https://content.twilio.com/v1/Contents`, {
    headers: { Authorization: `Basic ${auth}` },
  }).then(r => r.json());
  console.log("   Contents:", JSON.stringify(ct, null, 2));

  // 3. Prova a inviare WhatsApp via Sandbox o diretto
  console.log("\n3. Provo invio WhatsApp diretto (senza template)...");
  const waBody = new URLSearchParams({
    To: `whatsapp:+393480480942`,
    From: `whatsapp:+14155238886`,  // Twilio Sandbox number
    Body: "Ciao! Test WhatsApp da NeatX.",
  });
  const waResp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: waBody.toString(),
  });
  const waResult = await waResp.json();
  console.log("Status:", waResp.status);
  console.log("Risultato:", JSON.stringify(waResult, null, 2));
}

main().catch(console.error);
