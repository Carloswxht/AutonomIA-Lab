import { expect, test } from "@playwright/test";

test("la portada muestra marca, acceso, mensajes y asesor", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("autonomIA Lab").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("inteligencia artificial");
  await expect(page.getByRole("listitem")).toHaveCount(3);

  const asesor = page.getByRole("link", { name: "Habla con un asesor" });
  await expect(asesor).toHaveAttribute("href", /^https:\/\/wa\.me\/34605288673\?text=/);

  // Sin scroll horizontal en móvil.
  const anchoExtra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(anchoExtra).toBeLessThanOrEqual(0);

  await page.screenshot({ path: "test-results/portada-390.png", fullPage: true });
});

test("Entrar avisa de que el acceso llega pronto (aún sin login real)", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Correo").fill("ejemplo@ejemplo.com");
  await page.getByPlaceholder("Contraseña").fill("ejemplo");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("status")).toContainText("muy pronto");
});

test("Solicitar cuenta lleva a su página y vuelve", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Solicitar cuenta/ }).click();
  await expect(page).toHaveURL(/\/solicitar$/);
  await expect(page.getByRole("heading", { name: "Solicitar cuenta" })).toBeVisible();
  await page.screenshot({ path: "test-results/solicitar-390.png", fullPage: true });
  await page.getByRole("link", { name: "← Volver" }).click();
  await expect(page).toHaveURL(/\/$/);
});
