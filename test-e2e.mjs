// test-e2e.mjs
const BASE = "http://localhost:3000";

async function post(path, body, cookie = "") {
  const res = await fetch(`http://localhost:3000/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
  const t = await res.text();
  try { return JSON.parse(t); } catch { return { raw: t }; }
}

async function get(path, cookie = "") {
  const res = await fetch(`http://localhost:3000/api${path}`, { headers: cookie ? { Cookie: cookie } : {} });
  return res.json().catch(() => ({}));
}

async function run() {
  console.log("=".repeat(50));
  console.log("TEST FLUSSO COMPLETO NEATX (LOCALHOST)");
  console.log("=".repeat(50));

  // 1. REGISTRAZIONE
  console.log("\n1️⃣  REGISTRAZIONE...");
  const regRes = await fetch("http://localhost:3000/api/onboarding", {
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
  const loginRes = await fetch("http://localhost:3000/api/tenant-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: tenant.slug, password: "TestPass123!" }),
  });
  const loginText = await loginRes.text();
  const loginJson = JSON.parse(loginText);
  console.log("Login:", loginRes.status);
  const setCookie = loginRes.headers.get("set-cookie");
  if (!setCookie) return console.error("❌ Nessun cookie");
  const cookie = setCookie.split(";")[0].trim();
  console.log("Cookie OK:", setCookie.substring(0, 60) + "...");

  // TEST COOKIE
  console.log("\n🔍 TEST COOKIE...");
  const testCookie = await fetch(`http://localhost:3000/api/referral?tenantId=${tenant.slug}`, {
    headers: { Cookie: cookie },
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
    const r = await fetch("http://localhost:3000/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(s),
    });
    console.log(`  ${s.name}:`, r.status === 200 ? "✅" : "❌ " + r.status);
  }

  // STAFF
  console.log("\n4️⃣ STAFF...");
  const staffRes = await fetch("http://localhost:3000/api/staff", {
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
  const sched = await fetch("http://localhost:3000/api/staff/schedule", {
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
  const avail = await fetch(`http://localhost:3000/api/availability?date=${tomorrow.toISOString().split("T")[0]}&serviceId=1`, {
    headers: { Cookie: "cookie" }
  }).then(r => r.json());
  console.log("Disponibilità:", avail);

  // BOOKING
  console.log("\n7️⃣ BOOKING...");
  const tomorrow2 = new Date();
  tomorrow2.setDate(tomorrow2.getDate() + 1);
  const dateStr2 = tomorrow2.toISOString().split("T")[0];
  const booking = await fetch("http://localhost:3000/api/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId: "1",
      date: dateStr,
      time: "10:00",
      customerName: "Test",
      customerPhone: "393331234567",
      source: "ONLINE",
    }),
  }).then(r => r.json());
  console.log("Booking:", booking);

  // CRON
  console.log("\n8️⃣ CRON...");
  const cron = await fetch("http://localhost:3000/api/cron/reminders").then(r => r.json());
  console.log("Cron:", cron);

  console.log("\n" + "=".repeat(50));
  console.log("TEST COMPLETATO");
  console.log("=".repeat(50));
}

run().catch(e => { console.error("❌", e); process.exit(1); });