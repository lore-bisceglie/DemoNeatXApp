import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx prisma db push --schema=prisma/schema.test.prisma --force-reset --accept-data-loss && npx tsx prisma/seed-test-shop.ts && npx next dev -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      DATABASE_URL: "file:./test.db",
      NODE_ENV: "test",
      MOCK_EMAIL: "true",
      NEXT_PUBLIC_APP_URL: "http://localhost:3001",
      NEXT_PUBLIC_ROOT_DOMAIN: "localhost:3001",
      PORT: "3001",
    },
  },
});
