const sid = "ACcf6aa41e2e64203e1fc7b23fe9d51c1d";
const token = "65c68f6d4e2eb7175aa07544a82fb9ea";
const auth = Buffer.from(`${sid}:${token}`).toString("base64");

async function main() {
  // 1. Controlla i WhatsApp Sender configurati
  console.log("1. WhatsApp Senders:");
  const ws = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?PageSize=1`, {
    headers: { Authorization: `Basic ${auth}` },
  }).then(r => r.json());
  
  // Prova a vedere le configurazioni WhatsApp
  const waSenders = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Applications.json`, {
    headers: { Authorization: `Basic ${auth}` },
  }).then(r => r.json());
  console.log("   Applications:", JSON.stringify(waSenders, null, 2));

  // 2. Controlla Content Templates (WhatsApp) sull'endpoint corretto
  console.log("\n2. WhatsApp Templates (content API):");
  try {
    const ct = await fetch(`https://content.twilio.com/v1/Contents?PageSize=20`, {
      headers: { Authorization: `Basic ${auth}` },
    }).then(r => r.json());
    console.log("   Risultato:", JSON.stringify(ct, null, 2));
  } catch(e) {
    console.log("   Errore:", e.message);
  }

  // 3. Prova a inviare WhatsApp usando il numero dell'account con whatsapp:
  console.log("\n3. Provo WhatsApp da +16602302975...");
  const waBody = new URLSearchParams({
    To: `whatsapp:+393480480942`,
    From: `whatsapp:+16602302975`,
    Body: "Ciao! Test WhatsApp da NeatX via numero account.",
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
  
  // 4. Prova anche con ContentSid (template) se esiste
  // Intanto provo a vedere se esiste un template
  console.log("\n4. Controllo se esiste un ContentSid...");
  const msgResp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages/SM29991e49feba079ffbd258f065296760.json`, {
    headers: { Authorization: `Basic ${auth}` },
  }).then(r => r.json());
  console.log("   Ultimo messaggio:", JSON.stringify(msgResp, null, 2));
}

main().catch(console.error);
