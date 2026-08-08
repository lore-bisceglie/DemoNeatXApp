import { test, expect } from "@playwright/test";

/**
 * Test della PRENOTAZIONE PUBBLICA.
 *
 * Usa un negozio di test FISSO ("negozio-test") creato dal seed
 * `prisma/seed-test-shop.ts` (eseguito dal webServer del config).
 * NON registra negozi nuovi: il negozio esiste già, pubblicato e
 * pronto per prenotare. Questo evita di creare decine di negozi a
 * ogni run e di innescare il rate limit.
 */

test("Prenotazione pubblica: il cliente sceglie servizio, orario e prenota", async ({ page }) => {
  page.on("dialog", async (dialog) => {
    console.log(`[Dialog] ${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss().catch(() => {});
  });

  // 1. Apri la pagina di prenotazione del negozio fisso
  await page.goto("/t/negozio-test");
  try {
    await expect(page.locator("body")).toContainText(/Scegli il servizio|Prenota|prenotazione/i, { timeout: 15000 });
  } catch (e) {
    const body = await page.innerText("body");
    console.log("=== DUMP NEGOZIO FISSO ===");
    console.log(body.slice(0, 1500));
    throw e;
  }

  // 2. Scegli un servizio (select)
  const serviceSelect = page.locator("select").first();
  await expect(serviceSelect).toBeVisible({ timeout: 15000 });
  const optionsCount = await serviceSelect.locator("option").count();
  expect(optionsCount).toBeGreaterThan(0);
  await serviceSelect.selectOption({ index: 1 });
  await expect(page.locator("body")).toContainText(/Orari disponibili/i, { timeout: 10000 });

  // 3. Scegli un orario (select "Orari disponibili")
  const slotSelect = page.locator("select").filter({ hasText: /Seleziona un orario|:00/ });
  await expect(slotSelect).toBeVisible({ timeout: 10000 });
  const slotCount = await slotSelect.locator("option").count();
  expect(slotCount).toBeGreaterThan(1);
  await slotSelect.selectOption({ index: 1 });

  // 4. Inserisci nome e telefono
  await page.fill('input[placeholder="Il tuo nome"]', "Cliente Online E2E");
  await page.fill('input[placeholder="Il tuo numero (WhatsApp)"]', "3331112223");

  // 5. Accetta la privacy (checkbox obbligatoria)
  await page.check("#privacy");

  // 6. Clicca il bottone di prenotazione
  const bookButton = page.locator("button", { hasText: /Prenota/i });
  await expect(bookButton).toBeEnabled({ timeout: 10000 });
  await bookButton.click();

  // 7. Il flusso reale porta alla pagina di successo
  await expect(page).toHaveURL(/\/success/, { timeout: 20000 });
  await expect(page.locator("body")).toContainText(/Conferma|successo|prenotat/i, { timeout: 15000 });
});

test("Prenotazione pubblica: senza servizio il bottone è disabilitato", async ({ page }) => {
  await page.goto("/t/negozio-test");
  await expect(page.locator("body")).toContainText(/Scegli il servizio|Prenota|prenotazione/i, { timeout: 15000 });

  // Senza scegliere nulla, il bottone di prenotazione deve essere disabilitato
  const bookButton = page.locator("button", { hasText: /Prenota/i });
  await expect(bookButton).toBeDisabled({ timeout: 10000 });
});
