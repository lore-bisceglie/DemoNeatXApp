import { test, expect } from "@playwright/test";

test("Complete NeatX E2E Journey: Onboarding, Admin Login & Dashboard Booking", async ({ page }) => {
  const timestamp = Date.now();
  const testBusinessName = `Barber Playwright ${timestamp}`;
  const testEmail = `playwright.${timestamp}@example.com`;
  const testOwner = "Mario Rossi";
  const testCity = "Milano";
  const testPhone = "3331234567";
  const testPassword = "Password123!";

  let tenantSlug = "";

  // Auto-dismiss unexpected alert dialogs if any occur
  page.on("dialog", async (dialog) => {
    console.log(`[Dialog] ${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss().catch(() => {});
  });

  await test.step("1. Onboarding & Store Creation flow", async () => {
    // Navigate to registration page
    await page.goto("/registrazione");

    // Verify main onboarding page elements are visible
    await expect(page.locator("h1")).toContainText(/Registrati|crea/i);
    await expect(page.getByRole("heading", { name: "Crea il tuo account" })).toBeVisible();

    // Fill onboarding form fields
    await page.fill('input[placeholder="Es. Barber Lab Milano"]', testBusinessName);
    await page.fill('input[placeholder="Milano"]', testCity);
    await page.fill('input[placeholder="Lorenzo"]', testOwner);
    await page.fill('input[placeholder="Es. 3331234567"]', testPhone);
    await page.fill('input[placeholder="Es. mario@email.com"]', testEmail);
    await page.fill('input[placeholder="Almeno 8 caratteri"]', testPassword);

    // Accept legal terms
    await page.check("input#onboarding-legal");

    // Submit form
    const createButton = page.getByRole("button", { name: "Crea la mia pagina prenotazioni" });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // Expect successful store creation screen
    await expect(page.getByText(/online|Account creato/i)).toBeVisible({ timeout: 20000 });

    // Extract admin dashboard link
    const adminLink = page.getByRole("link", { name: "Entra nella dashboard" });
    await expect(adminLink).toBeVisible();

    const href = await adminLink.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toContain("/admin");

    // Extract slug
    tenantSlug = href!.replace("/t/", "").replace("/admin", "").replace(/^\/+|\/+$/g, "");
    expect(tenantSlug).not.toBe("");

    // Click link to enter dashboard
    await adminLink.click();
  });

  await test.step("2. Admin authentication & login", async () => {
    // Expect Login Screen if unauthenticated
    await expect(page.getByText("Area Privata")).toBeVisible({ timeout: 10000 });

    // Fill login credentials
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Submit login form
    await page.getByRole("button", { name: "Accedi" }).click();

    // Verify successful redirection and rendering of Admin Dashboard
    await expect(page.getByText("Area Privata")).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("body")).toContainText(testBusinessName, { timeout: 15000 });
  });

  await test.step("3. Dashboard navigation & booking management interaction", async () => {
    // Verify tenant name is displayed on dashboard
    await expect(page.locator("body")).toContainText(testBusinessName);

    // Locate free slot button for Walk-In / Manual appointment creation
    const freeSlotButton = page.locator("button:has-text('Libero')").first();
    await expect(freeSlotButton).toBeVisible({ timeout: 15000 });
    await freeSlotButton.click();

    // Verify modal "Nuovo Inserimento Admin" appears
    await expect(page.getByText("Nuovo Inserimento Admin")).toBeVisible();

    // Fill appointment form
    await page.fill('input[placeholder="Nome Cliente (Obbligatorio)"]', "Cliente E2E Playwright");
    await page.fill('input[placeholder="Telefono (Opzionale per WhatsApp)"]', "3339998877");

    // Submit booking modal
    const saveButton = page.getByRole("button", { name: "Salva e Blocca" });
    await saveButton.click();

    // Confirm modal closes and created appointment appears in agenda
    await expect(page.getByText("Nuovo Inserimento Admin")).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("body")).toContainText("Cliente E2E Playwright", { timeout: 15000 });
  });
});
