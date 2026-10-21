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
    launchOptions: {
      ...(existsSync(chromiumLocal) ? { executablePath: chromiumLocal } : {}),
      // En el entorno de Claude Code la salida a internet (Supabase) pasa por un proxy que vuelve a cifrar.
      ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } } : {}),
    },
    ignoreHTTPSErrors: Boolean(process.env.HTTPS_PROXY),
  },
  projects: [
    {
      name: "movil",
      // Móvil primero: 390x844 (iPhone 12-15 / Android medio).
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    // La web es de páginas fijas: se sirve la carpeta out/ (hace falta `npm run build` antes), como GitHub Pages.
    command: "node scripts/servir.mjs 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
  },
});
