import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// En el entorno de Claude Code el Chromium viene preinstalado aquí; en CI lo instala Playwright.
const chromiumLocal = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    launchOptions: existsSync(chromiumLocal) ? { executablePath: chromiumLocal } : {},
  },
  projects: [
    {
      name: "movil",
      // Móvil primero: 390x844 (iPhone 12-15 / Android medio).
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
  },
});
