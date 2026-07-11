// test-e2e.mjs
const BASE = process.env.BASE_URL || "https://www.neatx.store";
const SUFFIX = Date.now();
const email = `test-${SUFFIX}@neatx-test.dev`;

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
  console.log("=".repeat(50));
  console.log("TEST E2E NEATX — PRODUZIONE");
  console.log("=".repeat(50));

  // 1. REGISTRAZIONE
  console.log("\n1️⃣  REGISTRAZIONE...");
  const reg = await jsonFetch(`${BASE}/api/onboarding`, {
    method: "POST",
    body: JSON.stringify({
      businessName: "Test " + SUFFIX,
      category: "barber", city: "Roma",
      ownerName: "Mario Test", email,
      password: "TestPass123!", phone: "393312345678",
      address: "Via Test 1, Roma",
    }),
  });
  console.log("Status:", reg.status, reg.data.success ? "✅" : "❌");
  if (!reg.data.success) { console.error(reg.data); return; }
  const { slug } = reg.data;
  console.log("Tenant slug:", slug);

  // 1b. Recupera ID tenant
  console.log("\n1b️⃣  RECUPERO ID TENANT...");
  const tenantInfo = await jsonFetch(`${BASE}/api/tenant/${slug}`);
  if (tenantInfo.status !== 200 || !tenantInfo.data.id) {
    console.error("❌ Impossibile recuperare tenant:", tenantInfo.data);
    return;
  }
  const tenantId = tenantInfo.data.id;
  console.log("ID tenant:", tenantId);

  // 2. LOGIN
  console.log("\n2️⃣  LOGIN...");
  const login = await jsonFetch(`${BASE}/api/tenant-login`, {
    method: "POST",
    body: JSON.stringify({ slug, password: "TestPass123!" }),
  });
  console.log("Login:", login.status);
  const setCookie = login.headers.get("set-cookie");
  if (!setCookie) { console.error("❌ Nessun cookie"); return; }
  const cookie = setCookie.split(";")[0];
  console.log("Cookie OK");

  // 3. SERVIZI
  console.log("\n3️⃣  SERVIZI...");
  const services = [
    { name: "Taglio", duration: 30, price: 25 },
    { name: "Barba", duration: 15, price: 10 },
  ];
  const createdServices = [];
  for (const s of services) {
    const r = await jsonFetch(`${BASE}/api/services`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify(s),
    });
    console.log(`  ${s.name}:`, r.status === 200 ? "✅" : `❌ ${r.status} ${JSON.stringify(r.data)}`);
    if (r.status === 200) createdServices.push(r.data.service);
  }
  if (createdServices.length === 0) { console.error("❌ Nessun servizio creato, mi fermo"); return; }

  // 4. STAFF
  console.log("\n4️⃣  STAFF...");
  const staff = await jsonFetch(`${BASE}/api/staff`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: JSON.stringify({ name: "Mario", tenantId, services: [] }),
  });
  console.log("Staff:", staff.status === 200 ? "✅" : `❌ ${staff.status} ${JSON.stringify(staff.data)}`);
  const staffId = staff.status === 200 ? staff.data.id : null;

  // 5. ORARI (PUT)
  console.log("\n5️⃣  ORARI...");
  const baseSchedule = {
    Monday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Tuesday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Wednesday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Thursday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Friday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Saturday: { active: true, blocks: [{ start: "09:00", end: "13:00" }] },
    Sunday: { active: false, blocks: [] },
  };
  if (staffId) {
    const sched = await jsonFetch(`${BASE}/api/staff/schedule`, {
      method: "PUT",
      headers: { Cookie: cookie },
      body: JSON.stringify({ staffId, baseSchedule }),
    });
    console.log("Orari:", sched.status === 200 ? "✅" : `❌ ${sched.status} ${JSON.stringify(sched.data)}`);
  } else {
    console.log("Orari: ⏭️ saltato (no staff)");
  }

  // 6. DISPONIBILITÀ
  console.log("\n6️⃣  DISPONIBILITÀ...");
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];
  const avail = await jsonFetch(`${BASE}/api/availability?date=${dateStr}&tenantId=${tenantId}&serviceId=${createdServices[0].id}`, {
    headers: { Cookie: cookie }
  });
  console.log("Disponibilità:", avail.status === 200 ? `✅ (${avail.data.slots?.length || 0} slot)` : `❌ ${JSON.stringify(avail.data)}`);

  // 7. BOOKING
  console.log("\n7️⃣  BOOKING...");
  const booking = await jsonFetch(`${BASE}/api/book`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: JSON.stringify({
      serviceId: createdServices[0].id,
      date: dateStr, time: "10:00",
      customerName: "Test", customerPhone: "393331234567",
      tenantId, source: "ONLINE", duration: createdServices[0].duration,
    }),
  });
  console.log("Booking:", booking.status === 200 ? "✅" : `❌ ${JSON.stringify(booking.data)}`);

  // 8. CRON (skip, richiede CRON_SECRET)
  console.log("\n8️⃣  CRON... ⏭️ saltato (richiede CRON_SECRET)");

  console.log("\n" + "=".repeat(50));
  console.log("TEST COMPLETATO");
  console.log("=".repeat(50));
}

run().catch(e => { console.error("❌", e); process.exit(1); });
