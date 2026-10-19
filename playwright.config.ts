import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4322", locale: "pt-BR", timezoneId: "America/Fortaleza" },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm build && exec python3 -m http.server 4322 --bind 127.0.0.1 --directory dist",
    url: "http://127.0.0.1:4322",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
