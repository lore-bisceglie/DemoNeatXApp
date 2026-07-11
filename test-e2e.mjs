// test-e2e.mjs — NEATX FULL E2E
const BASE = process.env.BASE_URL || "https://www.neatx.store";
const ROOT = "neatx.store";
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
  // 1. ONBOARDING
  // ─────────────────────────────────────────────
  console.log("\n1️⃣  ONBOARDING");
  const reg = await jsonFetch(`${BASE}/api/onboarding`, {
    method: "POST",
    body: JSON.stringify({
      businessName: "Test " + SUFFIX, category: "barber", city: "Roma",
      ownerName: "Mario Test", email, password: "TestPass123!",
      phone: "393312345678", address: "Via Test 1, Roma",
    }),
  });
  check("Registrazione", reg.status === 200 && reg.data.success, reg.status + '');
  const { slug, publicUrl, adminUrl } = reg.data;

  // ─────────────────────────────────────────────
  // 2. RECUPERA TENANT
  // ─────────────────────────────────────────────
  console.log("\n2️⃣  RECUPERA TENANT");
  const ten = await jsonFetch(`${BASE}/api/tenant/${slug}`);
  check("API tenant pubblica", ten.status === 200 && ten.data.id, JSON.stringify(ten.data).slice(0, 80));
  const tenantId = ten.data.id;

  // ─────────────────────────────────────────────
  // 3. LOGIN
  // ─────────────────────────────────────────────
  console.log("\n3️⃣  LOGIN");
  const login = await jsonFetch(`${BASE}/api/tenant-login`, {
    method: "POST",
    body: JSON.stringify({ slug, password: "TestPass123!" }),
  });
  check("Login", login.status === 200);
  const setCookie = login.headers.get("set-cookie");
  const cookie = setCookie?.split(";")[0] || "";
  check("Cookie ricevuto", !!setCookie);

  // ─────────────────────────────────────────────
  // 4. SERVIZI CRUD
  // ─────────────────────────────────────────────
  console.log("\n4️⃣  SERVIZI CRUD");
  const s1 = await jsonFetch(`${BASE}/api/services`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Taglio", duration: 30, price: 25 }) });
  check("Crea servizio", s1.status === 200);
  const s2 = await jsonFetch(`${BASE}/api/services`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Barba", duration: 15, price: 10 }) });
  check("Crea servizio 2", s2.status === 200);
  const svcId = s1.data.service.id;

  const svcList = await jsonFetch(`${BASE}/api/services`, { headers: { Cookie: cookie } });
  check("Lista servizi", svcList.status === 200 && svcList.data.services?.length >= 2);

  const svcUpd = await jsonFetch(`${BASE}/api/services`, { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ id: svcId, name: "Taglio Uomo", duration: 30, price: 30 }) });
  check("Modifica servizio", svcUpd.status === 200 && svcUpd.data.service?.name === "Taglio Uomo");

  // ─────────────────────────────────────────────
  // 5. STAFF CRUD
  // ─────────────────────────────────────────────
  console.log("\n5️⃣  STAFF CRUD");
  const staff = await jsonFetch(`${BASE}/api/staff`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Mario", tenantId, services: [svcId] }) });
  check("Crea staff", staff.status === 200);
  const staffId = staff.data.id;

  const staffList = await jsonFetch(`${BASE}/api/staff?tenantId=${tenantId}`);
  check("Lista staff", staffList.status === 200 && staffList.data?.length >= 1);

  const svcLink = await jsonFetch(`${BASE}/api/staff`, { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ staffId, serviceIds: [svcId] }) });
  check("Collega servizio a staff", svcLink.status === 200);

  // ─────────────────────────────────────────────
  // 6. ORARI
  // ─────────────────────────────────────────────
  console.log("\n6️⃣  ORARI");
  const baseSchedule = {
    Monday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Tuesday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Wednesday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Thursday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Friday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Saturday: { active: true, blocks: [{ start: "09:00", end: "13:00" }] },
    Sunday: { active: false, blocks: [] },
  };
  const orari = await jsonFetch(`${BASE}/api/staff/schedule`, { method: "PUT", headers: { Cookie: cookie }, body: JSON.stringify({ staffId, baseSchedule }) });
  check("Imposta orari", orari.status === 200);
  const orariGet = await jsonFetch(`${BASE}/api/staff/schedule?staffId=${staffId}`);
  check("Leggi orari", orariGet.status === 200 && Object.keys(orariGet.data.baseSchedule || {}).length > 0);

  // ─────────────────────────────────────────────
  // 7. DISPONIBILITÀ
  // ─────────────────────────────────────────────
  console.log("\n7️⃣  DISPONIBILITÀ");
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];
  const avail = await jsonFetch(`${BASE}/api/availability?date=${dateStr}&tenantId=${tenantId}&serviceId=${svcId}`, { headers: { Cookie: cookie } });
  check("Calcola disponibilità", avail.status === 200 && Array.isArray(avail.data.slots), JSON.stringify(avail.data).slice(0, 60));

  // ─────────────────────────────────────────────
  // 8. BOOKING
  // ─────────────────────────────────────────────
  console.log("\n8️⃣  BOOKING");
  const slotTime = avail.data.slots?.[0] || "10:00";
  const book = await jsonFetch(`${BASE}/api/book`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({
    serviceId: svcId, date: dateStr, time: slotTime,
    customerName: "Test", customerPhone: "393331234567",
    tenantId, source: "ONLINE", duration: 30,
  })});
  check("Crea prenotazione", book.status === 200 && book.data.success, JSON.stringify(book.data).slice(0, 80));

  // ─────────────────────────────────────────────
  // 9. REFERRAL
  // ─────────────────────────────────────────────
  console.log("\n9️⃣  REFERRAL");
  const ref = await jsonFetch(`${BASE}/api/referral?tenantId=${tenantId}`, { headers: { Cookie: cookie } });
  check("Referral", ref.status === 200 && ref.data.referralCode, JSON.stringify(ref.data).slice(0, 80));

  // ─────────────────────────────────────────────
  // 10. CLIENTI
  // ─────────────────────────────────────────────
  console.log("\n🔟  CLIENTI");
  const cust = await jsonFetch(`${BASE}/api/customers?tenantId=${tenantId}`);
  check("Lista clienti", cust.status === 200);

  // ─────────────────────────────────────────────
  // 11. ELIMINA SERVIZIO
  // ─────────────────────────────────────────────
  console.log("\n1️⃣1️⃣  ELIMINA SERVIZIO");
  const del = await jsonFetch(`${BASE}/api/services?id=${svcId}`, { method: "DELETE", headers: { Cookie: cookie } });
  check("Elimina servizio", del.status === 200 && del.data.success);

  // ─────────────────────────────────────────────
  // 12. PAGINA PUBBLICA (subdomain)
  // ─────────────────────────────────────────────
  console.log("\n1️⃣2️⃣  PAGINA PUBBLICA (subdomain)");
  const pubRes = await fetch(publicUrl, { redirect: "manual" });
  const pubOk = pubRes.status === 200 && pubRes.headers.get("content-type")?.includes("text/html");
  check(`GET ${publicUrl}`, pubOk, `${pubRes.status} ${pubRes.headers.get("content-type") || ''}`);

  // ─────────────────────────────────────────────
  // 13. ADMIN PAGE (subdomain)
  // ─────────────────────────────────────────────
  console.log("\n1️⃣3️⃣  ADMIN PAGE (subdomain)");
  const adminRes = await fetch(adminUrl, { redirect: "manual", headers: { Cookie: cookie } });
  const adminOk = adminRes.status === 200 && adminRes.headers.get("content-type")?.includes("text/html");
  check(`GET ${adminUrl}`, adminOk, `${adminRes.status} ${adminRes.headers.get("content-type") || ''}`);

  // ─────────────────────────────────────────────
  // 14. ACCOUNT LOGIN (superadmin)
  // ─────────────────────────────────────────────
  console.log("\n1️⃣4️⃣  ACCOUNT LOGIN (superadmin)");
  const accLogin = await jsonFetch(`${BASE}/api/account-login`, {
    method: "POST",
    body: JSON.stringify({ email: "assistenza.neatx@gmail.com", password: "wrong!" }),
  });
  check("Login superadmin (wrong pw)", accLogin.status === 401, accLogin.status + '');

  // ─────────────────────────────────────────────
  // SOMMARIO
  // ─────────────────────────────────────────────
  console.log("\n" + "=".repeat(55));
  console.log(`  RISULTATO: ${ok} ✅  ${fail} ❌  ${ok + fail} totali`);
  console.log("=".repeat(55));
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error("❌ FATALE:", e.message); process.exit(1); });
