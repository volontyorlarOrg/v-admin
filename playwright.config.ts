import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3702);
const STUB_PORT = Number(process.env.E2E_STUB_PORT ?? 3703);
const baseURL = `http://127.0.0.1:${PORT}`;
const stubURL = `http://127.0.0.1:${STUB_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/stub-backend.mjs"],
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "node e2e/stub-backend.mjs",
      url: `${stubURL}/health/live`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { STUB_PORT: String(STUB_PORT) },
    },
    {
      command: `npm run build && npx next start -p ${PORT}`,
      url: `${baseURL}/uz/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_PORTAL_URL: baseURL,
        VOLONTYORLAR_API_URL: stubURL,
        VOLONTYORLAR_ADMIN_SESSION_SECRET:
          "e2e-only-admin-session-secret-that-is-long-enough-0123456789",
      },
    },
  ],
});
