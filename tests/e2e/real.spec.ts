import { expect, test } from "@playwright/test";

// Flujo completo contra el Supabase real. Solo corre con una cuenta de plataforma de prueba (ver docs/pruebas.md):
//   PRUEBA_EMAIL=… PRUEBA_PASSWORD=… npm run test:e2e
// Crea datos de ejemplo: una solicitud y un miembro ejemplo-solicitud-…@autonomialab.test. No toca ningún negocio.
const email = process.env.PRUEBA_EMAIL;
const password = process.env.PRUEBA_PASSWORD;
test.skip(!email || !password, "Sin credenciales de prueba (PRUEBA_EMAIL / PRUEBA_PASSWORD)");

test("solicitar acceso → aprobar → ficha de un negocio", async ({ page, browser }) => {
  const marca = Date.now().toString(36);
  const correo = `ejemplo-solicitud-${marca}@autonomialab.test`;

  // 1. Un visitante pide acceso solo con su correo y luego cuenta a qué se dedica.
  const visitante = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await visitante.goto("/entrar/");
  await visitante.getByRole("link", { name: /Solicitar acceso/ }).click();
  // Como lo deja el dictado: con mayúsculas y un punto al final.
  await visitante.getByLabel("Correo").fill(`${correo.toUpperCase()}.`);
  await visitante.getByRole("button", { name: "Solicitar acceso" }).click();
  await expect(visitante).toHaveURL(/\/solicitud\/\?t=[0-9a-f-]{36}$/);
  await expect(visitante.getByRole("heading", { name: "Solicitud recibida" })).toBeVisible();
  await expect(visitante.getByText("pendiente de aprobación")).toBeVisible();
  await visitante.screenshot({ path: "test-results/real-solicitud.png", fullPage: true });

  await visitante.getByText("Autónomo", { exact: true }).click();
  await visitante.getByLabel("Sector").selectOption("Hostelería");
  await visitante.getByLabel("Tu nombre").fill(`Ejemplo ${marca}`);
  await visitante.getByLabel("WhatsApp").fill("600000000");
  await visitante.getByLabel(/mejorar/).fill("Ejemplo: tomar pedidos desde la mesa.");
  await visitante.getByRole("button", { name: "Enviar" }).click();
  await expect(visitante.getByRole("status")).toContainText("Gracias");
  await visitante.close();

  // 2. Carlos entra, ve la solicitud y la aprueba.
  await page.goto("/entrar/");
  await page.getByPlaceholder("Correo").fill(email!);
  await page.getByPlaceholder("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/miembros\/$/);
  // Panel de miembros: la plataforma tiene acceso completo (las 6 secciones activas) y los paneles de cada producto.
  await expect(page.getByText("Acceso completo")).toBeVisible();
  await expect(page.getByRole("link", { name: /MultiBar/ })).toHaveAttribute("href", "https://carta.autonomialab.es/plataforma/");
  await expect(page.getByRole("link", { name: /Universidad/ })).toContainText("Activo");
  await page.screenshot({ path: "test-results/real-miembros.png", fullPage: true });
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.screenshot({ path: "test-results/real-menu.png" });
  await page.getByRole("link", { name: /Administración/ }).click();
  await expect(page).toHaveURL(/\/admin\/$/);

  const tarjeta = page.getByRole("listitem").filter({ hasText: correo });
  await expect(tarjeta).toContainText("Autónomo · Hostelería");
  await expect(tarjeta.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/34600000000");
  await page.screenshot({ path: "test-results/real-admin.png", fullPage: true });
  await tarjeta.getByRole("button", { name: "Aprobar" }).click();
  // Sin SMTP propio el correo no sale; la aprobación sí queda hecha y se avisa.
  await expect(page.getByText(/correo no ha salido/).or(page.getByText("No hay solicitudes nuevas."))).toBeVisible();
  await page.screenshot({ path: "test-results/real-aprobada.png" });
  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: correo })).toContainText("Gratis");

  // 3. Ficha de un negocio (el primero de la lista). Solo se prueba un correo sin acceso: no cambia nada.
  await page.locator('a[href^="/admin/negocio/?id="]').first().click();
  await expect(page).toHaveURL(/\/admin\/negocio\/\?id=\d+$/);
  await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible();
  await page.getByLabel("Correo").fill(`nadie-${marca}@autonomialab.test`);
  await page.getByRole("button", { name: "Dar acceso" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "todavía no tiene acceso" })).toBeVisible();
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(extra).toBeLessThanOrEqual(0);
  await page.screenshot({ path: "test-results/real-negocio.png", fullPage: true });

  // 5. Salir. Ese correo ya no puede volver a pedir acceso.
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/solicitar");
  await page.getByLabel("Correo").fill(correo);
  await page.getByRole("button", { name: "Solicitar acceso" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "ya tiene acceso" })).toBeVisible();
});

// Cuenta gratuita (sin aplicación contratada): ve 3 secciones y las de pago le llevan a WhatsApp.
const emailGratis = process.env.PRUEBA_GRATIS_EMAIL;
test("cuenta gratuita: secciones de pago cerradas y sin acceso a administración", async ({ page }) => {
  test.skip(!emailGratis, "Sin cuenta gratuita de prueba (PRUEBA_GRATIS_EMAIL)");
  await page.goto("/entrar/");
  await page.getByPlaceholder("Correo").fill(emailGratis!);
  await page.getByPlaceholder("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/miembros\/$/);
  await expect(page.getByText("Cuenta gratuita")).toBeVisible();
  await expect(page.getByRole("link", { name: /Ranking/ })).toContainText("Activo");
  const universidad = page.getByRole("link", { name: /Universidad/ });
  await expect(universidad).toContainText("Subir plan");
  await expect(universidad).toHaveAttribute("href", /^https:\/\/wa\.me\/34605288673/);
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(extra).toBeLessThanOrEqual(0);
  await page.screenshot({ path: "test-results/real-miembros-gratis.png", fullPage: true });

  // Una sección gratis se abre; una de pago, escrita a mano en la dirección, devuelve al panel.
  await page.getByRole("link", { name: /Ranking/ }).click();
  await expect(page.getByRole("heading", { name: "Ranking" })).toBeVisible();
  await page.goto("/miembros/universidad");
  await expect(page).toHaveURL(/\/miembros\/$/);
  // Sin permisos de administración.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/miembros\/$/);
  // El menú no ofrece Administración.
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("link", { name: /Administración/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/$/);
});
