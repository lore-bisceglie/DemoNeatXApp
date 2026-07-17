// test-qa.mjs
const BASE = process.env.BASE_URL || "https://www.neatx.store";
const SUFFIX = Date.now();
const email = `qa-${SUFFIX}@neatx-test.dev`;

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

let ok = 0, fail = 0;
function check(label, pass, detail) {
  if (pass) { ok++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}${detail ? ': ' + detail : ''}`); }
}

async function run() {
  console.log("=== NEATX QA SCRIPT ===");
  
  // 1. Setup Tenant
  console.log("\n📦 SETUP");
  const reg = await jsonFetch(`${BASE}/api/onboarding`, {
    method: "POST",
    body: JSON.stringify({
      businessName: "QA " + SUFFIX, category: "barber", city: "Milano",
      ownerName: "QA Tester", email, password: "TestPass123!",
      phone: "393312345678", address: "Via Roma 1, Milano",
    }),
  });
  check("Registrazione QA", reg.status === 200 && reg.data.success);
  const { slug, adminPassword } = reg.data;

  const ten = await jsonFetch(`${BASE}/api/tenant/${slug}`);
  const tenantId = ten.data.id;

  const login = await jsonFetch(`${BASE}/api/tenant-login`, {
    method: "POST",
    body: JSON.stringify({ slug, password: "TestPass123!" }),
  });
  const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";

  // 2. Crea servizio e staff
  const s1 = await jsonFetch(`${BASE}/api/services`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Taglio QA", duration: 30, price: 20 }) });
  const svcId = s1.data.service?.id;
  const staff = await jsonFetch(`${BASE}/api/staff`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({ name: "Dipendente QA", tenantId, serviceIds: [svcId] }) });
  const staffId = staff.data?.id;

  // 3. Imposta eccezione ferie per domani
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];
  
  const postStaff = await jsonFetch(`${BASE}/api/staff/schedule`, { 
      method: "POST", headers: { Cookie: cookie }, 
      body: JSON.stringify({ 
          staffId, 
          exceptions: [{ date: dateStr, type: "ferie" }] 
      }) 
  });
  check("Imposta ferie dipendente", postStaff.status === 200);

  // 4. Verifica disponibilità per domani (dovrebbe essere vuota o non avere il dipendente)
  const avail = await jsonFetch(`${BASE}/api/availability?date=${dateStr}&tenantId=${tenantId}&serviceId=${svcId}`);
  // L'array slots dovrebbe essere vuoto perché c'è un solo dipendente ed è in ferie
  check("Disponibilità bloccata per ferie", avail.data.slots && avail.data.slots.length === 0, `${avail.data.slots?.length} slots found`);

  // 5. Crea prenotazione dopodomani (salta domenica se cade di domenica)
  const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2);
  if (dayAfter.getDay() === 0) dayAfter.setDate(dayAfter.getDate() + 1);
  const dateAfter = dayAfter.toISOString().split("T")[0];
  const avail2 = await jsonFetch(`${BASE}/api/availability?date=${dateAfter}&tenantId=${tenantId}&serviceId=${svcId}`);
  check("Disponibilità sbloccata dopodomani", avail2.data.slots && avail2.data.slots.length > 0);
  
  const slotTime = avail2.data.slots[0];
  const book = await jsonFetch(`${BASE}/api/book`, { method: "POST", headers: { Cookie: cookie }, body: JSON.stringify({
    serviceId: svcId, date: dateAfter, time: slotTime,
    customerName: "QA Cust", customerPhone: "393331234567",
    tenantId, source: "ONLINE", duration: 30,
  })});
  check("Prenotazione completata", book.status === 200 && book.data.success);
  const cancelToken = book.data.cancelToken;

  // 6. Reschedule
  const avail2_after = await jsonFetch(`${BASE}/api/availability?date=${dateAfter}&tenantId=${tenantId}&serviceId=${svcId}`);
  const nextSlot = avail2_after.data.slots[0]; // Dovrebbe essere diverso da slotTime
  const resched = await jsonFetch(`${BASE}/api/reschedule/${cancelToken}`, {
      method: "POST",
      body: JSON.stringify({ date: dateAfter, time: nextSlot })
  });
  check("Spostamento riuscito", resched.status === 200 && resched.data.appointment, resched.status + " " + JSON.stringify(resched.data));

  // 7. Esportazione commercialista
  const exportRes = await jsonFetch(`${BASE}/api/export/timesheets?tenantId=${tenantId}`, { headers: { Cookie: `admin_auth_${slug}=${adminPassword}` }});
  check("Export Commercialista HTTP 200", exportRes.status === 200);
  check("Export Commercialista CSV generato", typeof exportRes.data.raw === "string" && exportRes.data.raw.includes("Ferie"), "Manca voce Ferie");

  // 8. Locations test
  const locRes = await jsonFetch(`${BASE}/api/locations?slug=${slug}`);
  check("Elenco locations", locRes.status === 200 && locRes.data.length > 0);

  const locPost = await jsonFetch(`${BASE}/api/locations?slug=${slug}`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({
          name: "Sede 2",
          slug: slug + "-2",
          address: "Via Test 2",
          city: "Roma",
          phone: "12345",
          isMain: false,
          isActive: true
      })
  });
  // Should fail because plan is not 'elite' (it's 'free' by default in onboarding)
  check("Limitazione sede (solo Elite)", locPost.status === 403 && locPost.data.code === 'PLAN_UPGRADE_REQUIRED', locPost.status);

  console.log(`\nRISULTATI QA: ${ok} ✅, ${fail} ❌`);
  process.exit(fail > 0 ? 1 : 0);
}

run();
