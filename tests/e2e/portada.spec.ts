import { expect, test } from "@playwright/test";

// Estos tests funcionan con o sin conexión a Supabase: comprueban pantallas, validaciones y errores.

const sinScrollLateral = async (page: import("@playwright/test").Page) => {
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(extra).toBeLessThanOrEqual(0);
};

test("la portada muestra marca, acceso, mensajes y asesor", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("autonomIA Lab").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("inteligencia artificial");
  await expect(page.getByRole("listitem")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Habla con un asesor" })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/34605288673\?text=/,
  );
  await expect(page.getByRole("link", { name: /Solicitar acceso/ })).toHaveAttribute("href", "/solicitar/");
  await expect(page.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toHaveAttribute("href", "/recuperar/");
  await sinScrollLateral(page);
  await page.screenshot({ path: "test-results/portada-390.png", fullPage: true });
});

test("Entrar con datos incorrectos (o sin conexión) muestra un error claro", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Correo").fill("ejemplo@ejemplo.com");
  await page.getByPlaceholder("Contraseña").fill("ejemplo");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /Correo o contraseña incorrectos|Inténtalo de nuevo/ }),
  ).toBeVisible();
});

test("sin sesión, miembros y administración vuelven a la portada", async ({ page }) => {
  await page.goto("/miembros");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/$/);
});

test("/registro lleva a solicitar acceso", async ({ page }) => {
  await page.goto("/registro");
  await expect(page).toHaveURL(/\/solicitar\/$/);
});

test("Solicitar acceso pide un correo válido y lo conserva", async ({ page }) => {
  await page.goto("/solicitar");
  await expect(page.getByRole("heading", { name: "Solicitar acceso" })).toBeVisible();
  await page.screenshot({ path: "test-results/solicitar-390.png", fullPage: true });
  await page.getByLabel("Correo").fill("ejemplo@sin-punto");
  await page.getByRole("button", { name: "Solicitar acceso" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Revisa el correo" })).toBeVisible();
  await expect(page.getByLabel("Correo")).toHaveValue("ejemplo@sin-punto");
  await sinScrollLateral(page);
});

test("Nueva contraseña comprueba que coincidan", async ({ page }) => {
  await page.goto("/nueva-contrasena");
  await page.getByLabel("Contraseña", { exact: true }).fill("unaclave8");
  await page.getByLabel("Repite la contraseña").fill("otraclave8");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Las contraseñas no coinciden." })).toBeVisible();
});

test("los enlaces caducados se explican", async ({ page }) => {
  await page.goto("/auth/confirmar?error=access_denied&error_code=otp_expired");
  await expect(page).toHaveURL(/\/confirmado\/\?motivo=caducado$/);
  await expect(page.getByRole("heading", { name: "El enlace ha caducado" })).toBeVisible();
  await page.goto("/auth/confirmar?siguiente=/nueva-contrasena&code=falso");
  await expect(page.getByRole("heading", { name: "El enlace no sirve" })).toBeVisible();
});

test("Recuperar contraseña pide un correo válido", async ({ page }) => {
  await page.goto("/recuperar");
  await page.getByLabel("Correo").fill("ejemplo@sin-punto");
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Revisa el correo" })).toBeVisible();
});
