import { expect, test } from "@playwright/test";

// Estos tests funcionan con o sin conexión a Supabase: comprueban pantallas, validaciones y errores.

test("la portada muestra marca, acceso, mensajes y asesor", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("autonomIA Lab").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("inteligencia artificial");
  await expect(page.getByRole("listitem")).toHaveCount(3);

  const asesor = page.getByRole("link", { name: "Habla con un asesor" });
  await expect(asesor).toHaveAttribute("href", /^https:\/\/wa\.me\/34605288673\?text=/);

  const anchoExtra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(anchoExtra).toBeLessThanOrEqual(0);

  await page.screenshot({ path: "test-results/portada-390.png", fullPage: true });
});

test("Entrar con datos incorrectos (o sin conexión) muestra un error claro", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Correo").fill("ejemplo@ejemplo.com");
  await page.getByPlaceholder("Contraseña").fill("ejemplo");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /Correo o contraseña incorrectos|No hemos podido iniciar sesión/ })).toBeVisible();
  await page.screenshot({ path: "test-results/entrar-error-390.png" });
});

test("el panel de miembros sin sesión vuelve a la portada", async ({ page }) => {
  await page.goto("/miembros");
  await expect(page).toHaveURL(/\/$/);
});

test("Solicitar cuenta valida el correo en el servidor", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Solicitar cuenta/ }).click();
  await expect(page).toHaveURL(/\/solicitar$/);
  await expect(page.getByRole("heading", { name: "Solicitar cuenta" })).toBeVisible();
  await page.screenshot({ path: "test-results/solicitar-390.png", fullPage: true });

  await page.getByLabel("Nombre").fill("Ejemplo");
  await page.getByLabel("Correo").fill("ejemplo@sin-punto");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Revisa el correo" })).toBeVisible();

  const anchoExtra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(anchoExtra).toBeLessThanOrEqual(0);

  await page.getByRole("link", { name: "← Volver" }).click();
  await expect(page).toHaveURL(/\/$/);
});
