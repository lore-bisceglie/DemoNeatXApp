// test-e2e.mjs — NEATX FULL E2E
const BASE = process.env.BASE_URL || "https://www.neatx.store";
const SUFFIX = Date.now();
const email = `test-${SUFFIX}@neatx-test.dev`;

let ok = 0, fail = 0;
function check(label, pass, detail) {
  if (pass) { ok++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}${detail ? ': ' + detail : ''}`); }
}

async function jsonFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data, headers: res.headers };
}

async function run() {
  console.log("=".repeat(55));
  console.log("  NEATX — TEST COMPLETO SU PRODUZIONE");
  console.log("=".repeat(55));

  // ─────────────────────────────────────────────
  // SETUP: registra tenant + login
  // ─────────────────────────────────────────────
  console.log("\n📦 SETUP");
  const reg = await jsonFetch(`${BASE}/api/onboarding`, {
    method: "POST",
    body: JSON.stringify({
      businessName: "Test " + SUFFIX, category: "barber", city: "Roma",
      ownerName: "Mario Test", email, password: "TestPass123!",
      phone: "393312345678", address: "Via Test 1, Roma",
    }),
  });
  check("Registrazione", reg.status === 200 && reg.data.success);
  const { slug, publicUrl, adminUrl } = reg.data;

  const ten = await jsonFetch(`${BASE}/api/tenant/${slug}`);
  check("GET tenant", ten.status === 200 && ten.data.id);
  const tenantId = ten.data.id;

  const login = await jsonFetch(`${BASE}/api/tenant-login`, {
    method: "POST",
    body: JSON.stringify({ slug, password: "TestPass123!" }),
  });
  check("Login", login.status === 200);
  const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";

  // Crea servizio e staff per test
  const s1 = await jsonFetch(`${BASE}/api/services`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Taglio", duration: 30, price: 25 }) });
  const svcId = s1.data.service?.id;
  const staff = await jsonFetch(`${BASE}/api/staff`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Mario", tenantId, services: [svcId] }) });
  const staffId = staff.data?.id;

  const baseSchedule = {
    Monday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Tuesday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Wednesday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Thursday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Friday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Saturday: { active: true, blocks: [{ start: "09:00", end: "13:00" }] },
    Sunday: { active: false, blocks: [] },
  };
  if (staffId) await jsonFetch(`${BASE}/api/staff/schedule`, { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ staffId, baseSchedule }) });

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  console.log("  Setup completato:", { slug, tenantId, svcId, staffId });

  // ─────────────────────────────────────────────
  // API CANCELLO PRENOTAZIONE
  // ─────────────────────────────────────────────
  console.log("\n1️⃣  BOOKING + CANCELLO");

  // Crea prenotazione
  const avail = await jsonFetch(`${BASE}/api/availability?date=${dateStr}&tenantId=${tenantId}&serviceId=${svcId}`);
  const slotTime = avail.data.slots?.[0] || "10:00";
  const book = await jsonFetch(`${BASE}/api/book`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({
    serviceId: svcId, date: dateStr, time: slotTime,
    customerName: "Test", customerPhone: "393331234567",
    tenantId, source: "ONLINE", duration: 30,
  })});
  check("Crea prenotazione", book.status === 200 && book.data.success);
  const cancelToken = book.data.cancelToken;

  // GET /api/cancel?token=...
  if (cancelToken) {
    const getCancel = await jsonFetch(`${BASE}/api/cancel?token=${cancelToken}`);
    check("GET /api/cancel (recupera)", getCancel.status === 200 && getCancel.data.appointment?.id);

    // POST /api/cancel (elimina)
    const postCancel = await jsonFetch(`${BASE}/api/cancel`, { method: "POST", body: JSON.stringify({ token: cancelToken }) });
    check("POST /api/cancel (elimina)", postCancel.status === 200 && postCancel.data.success);

    // Verifica che sia stato eliminato
    const getAfter = await jsonFetch(`${BASE}/api/cancel?token=${cancelToken}`);
    check("Verifica eliminato", getAfter.status === 200 && !getAfter.data.appointment);
  } else {
    console.log("  ⏭️ cancelToken non disponibile");
  }

  // ─────────────────────────────────────────────
  // STRIPE SUBSCRIBE (con fallback demo)
  // ─────────────────────────────────────────────
  console.log("\n2️⃣  STRIPE SUBSCRIBE (demo fallback)");
  const subRes = await jsonFetch(`${BASE}/api/stripe/subscribe`, {
    method: "POST",
    body: JSON.stringify({ tenantId, slug, plan: "pro", interval: "month" }),
  });
  check("Stripe subscribe (fallback)", subRes.status === 200 && subRes.data.url, subRes.status + ' ' + JSON.stringify(subRes.data).slice(0, 80));

  // ─────────────────────────────────────────────
  // STRIPE CONNECT (demo fallback)
  // ─────────────────────────────────────────────
  console.log("\n3️⃣  STRIPE CONNECT (demo fallback)");
  const connRes = await fetch(`${BASE}/api/stripe/connect?tenantId=${tenantId}`, { redirect: "manual" });
  check("Stripe connect (fallback)", connRes.status >= 300 && connRes.status < 400, connRes.status + ' redirect');

  // ─────────────────────────────────────────────
  // TELEGRAM MAGIC LOGIN
  // ─────────────────────────────────────────────
  console.log("\n4️⃣  TELEGRAM MAGIC LOGIN");
  const magic = await fetch(`${BASE}/api/telegram/magic?slug=${slug}&secret=${ten.data.adminPassword}`, { redirect: "manual" });
  const magicOk = magic.status >= 300 && magic.status < 400 && magic.headers.get("set-cookie")?.includes("admin_auth_");
  check("Telegram magic login", magicOk, `${magic.status} ${magic.headers.get("set-cookie")?.slice(0, 40) || ''}`);

  // ─────────────────────────────────────────────
  // TELEGRAM WEBHOOK (simula update finto)
  // ─────────────────────────────────────────────
  console.log("\n5️⃣  TELEGRAM WEBHOOK");
  const tgWebhook = await jsonFetch(`${BASE}/api/telegram/webhook`, {
    method: "POST",
    body: JSON.stringify({
      update_id: 12345,
      message: { message_id: 1, from: { id: 999, is_bot: false, first_name: "Test" }, chat: { id: 999 }, text: "/stats", date: Math.floor(Date.now() / 1000) },
    }),
  });
  check("Telegram webhook /stats", tgWebhook.status === 200, tgWebhook.status + ' ' + JSON.stringify(tgWebhook.data).slice(0, 60));

  // ─────────────────────────────────────────────
  // CRON TRIALS
  // ─────────────────────────────────────────────
  console.log("\n6️⃣  CRON TRIALS");
  const cronHeaders = process.env.CRON_SECRET ? { Authorization: `Bearer ${process.env.CRON_SECRET}` } : {};
  const cronRes = await jsonFetch(`${BASE}/api/cron/trials`, { headers: cronHeaders });
  const cronOk = cronRes.status === 200 || cronRes.status === 401;
  check("CRON trials", cronOk, `${cronRes.status} ${JSON.stringify(cronRes.data).slice(0, 60)}`);

  // ─────────────────────────────────────────────
  // PAGINA PUBBLICA + ADMIN
  // ─────────────────────────────────────────────
  console.log("\n7️⃣  PAGINE (subdomain)");
  const pub = await fetch(publicUrl, { redirect: "manual" });
  check(`Pagina pubblica ${publicUrl}`, pub.status === 200 && pub.headers.get("content-type")?.includes("text/html"), `${pub.status}`);

  const adm = await fetch(adminUrl, { redirect: "manual", headers: { Cookie: cookie } });
  check(`Admin page ${adminUrl}`, adm.status === 200 && adm.headers.get("content-type")?.includes("text/html"), `${adm.status}`);

  // ─────────────────────────────────────────────
  // PAGINA CANCELLO (root level)
  // ─────────────────────────────────────────────
  console.log("\n8️⃣  PAGINA CANCELLO /cancel/[token]");
  const cancelPage = await fetch(`${BASE}/cancel/fake-test-token`, { redirect: "manual" });
  check("Pagina cancel (root)", cancelPage.status === 200 && cancelPage.headers.get("content-type")?.includes("text/html"), `${cancelPage.status}`);

  // ─────────────────────────────────────────────
  // SOMMARIO
  // ─────────────────────────────────────────────
  console.log("\n" + "=".repeat(55));
  console.log(`  RISULTATO: ${ok} ✅  ${fail} ❌  ${ok + fail} totali`);
  console.log("=".repeat(55));
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error("❌ FATALE:", e.message); process.exit(1); });
