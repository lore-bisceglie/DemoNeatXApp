// test-e2e.mjs - Test E2E NeatX
async function run() {
  console.log("=".repeat(50));
  console.log("TEST FLUSSO COMPLETO NEATX");
  console.log("=".repeat(50));

  // 1. REGISTRAZIONE
  console.log("\n1️⃣  REGISTRAZIONE...");
  const regRes = await fetch("https://www.neatx.store/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessName: "Test " + Date.now(),
      category: "barber",
      city: "Roma",
      ownerName: "Mario Test",
      email: "assistenza.neatx@gmail.com",
      password: "TestPass123!",
      phone: "393312345678",
      address: "Via Test 1, Roma",
    }),
  });
  const regJson = await regRes.json();
  console.log("Status:", regRes.status, regJson.success ? "✅" : "❌");
  if (!regJson.success) return;
  const tenant = regJson;
  console.log("✅ Tenant:", tenant.slug);

  // LOGIN
  console.log("\n2️⃣  LOGIN...");
  const loginRes = await fetch("https://www.neatx.store/api/tenant-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: tenant.slug, password: "TestPass123!" }),
  });
  const setCookie = loginRes.headers.get("set-cookie");
  if (!setCookie) return console.error("❌ Nessun cookie");
  const cookie = setCookie.split(";")[0].trim();
  console.log("Cookie OK:", setCookie.substring(0, 60) + "...");

  async function post(path, body) {
    const res = await fetch("https://www.neatx.store/api" + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function get(path) {
    return fetch("https://www.neatx.store/api" + path, { headers: { Cookie: cookie } }).then(r => r.json());
  }

  // TEST COOKIE SU SUBDOMAIN TENANT
  console.log("\n🔍 TEST COOKIE SU SUBDOMAIN...");
  const testCookie = await fetch(`https://${tenant.slug}.neatx.store/api/referral?tenantId=${tenant.slug}`, {
    headers: { Cookie: cookie }
  }).then(r => r.json());
  console.log("Test cookie:", testCookie);

  // SERVIZI
  console.log("\n3️⃣  SERVIZI...");
  const services = [
    { name: "Taglio", duration: 30, price: 25 },
    { name: "Barba", duration: 15, price: 10 },
    { name: "Taglio + Barba", duration: 45, price: 30 },
  ];
  for (const s of services) {
    const r = await fetch(`https://${tenant.slug}.neatx.store/api/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(s),
    });
    console.log(`  ${s.name}:`, r.status === 200 ? "✅" : "❌ " + r.status);
  }

  // STAFF
  console.log("\n4️⃣ STAFF...");
  const staffRes = await fetch(`https://${tenant.slug}.neatx.store/api/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ name: "Mario", services: [] }),
  });
  console.log("Staff:", staffRes.status === 200 ? "✅" : "❌ " + staffRes.status);

  // ORARI
  console.log("\n5️⃣ ORARI...");
  const baseSchedule = {
    Monday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Tuesday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Wednesday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Thursday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Friday: { active: true, blocks: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "19:00" }] },
    Saturday: { active: true, blocks: [{ start: "09:00", end: "13:00" }] },
    Sunday: { active: false, blocks: [] },
  };
  const sched = await fetch(`https://${tenant.slug}.neatx.store/api/staff/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ staffId: "all", baseSchedule }),
  });
  console.log("Orari:", sched.status === 200 ? "✅" : "❌ " + sched.status);

  // DISPONIBILITÀ
  console.log("\n6️⃣ DISPONIBILITÀ...");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];
  const avail = await fetch(`https://${tenant.slug}.neatx.store/api/availability?date=${dateStr}&serviceId=1`, {
    headers: { Cookie: cookie }
  }).then(r => r.json());
  console.log("Disponibilità:", avail);

  // BOOKING
  console.log("\n7️⃣ BOOKING...");
  const booking = await fetch(`https://${tenant.slug}.neatx.store/api/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId: "1",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      time: "10:00",
      customerName: "Test",
      customerPhone: "393331234567",
      source: "ONLINE",
    }),
  }).then(r => r.json());
  console.log("Booking:", booking);

  // CRON
  console.log("\n8️⃣ CRON...");
  const cron = await fetch(`https://${tenant.slug}.neatx.store/api/cron/reminders`, {
    headers: { Cookie: cookie }
  }).then(r => r.json());
  console.log("Cron:", cron);

  console.log("\n" + "=".repeat(50));
  console.log("FINE TEST");
  console.log("=".repeat(50));
}

run().catch(e => { console.error("❌", e); process.exit(1); });