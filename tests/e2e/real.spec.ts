import { expect, test } from "@playwright/test";

// Flujo completo contra el Supabase real. Solo corre con un usuario de prueba superadmin (ver docs/pruebas.md):
//   PRUEBA_EMAIL=… PRUEBA_PASSWORD=… npm run test:e2e
// Crea datos de ejemplo (una cuenta ejemplo-registro-…@autonomialab.test y un cliente "Ejemplo Bar …").
const email = process.env.PRUEBA_EMAIL;
const password = process.env.PRUEBA_PASSWORD;
// El registro por la web necesita que Supabase pueda enviar correos (SMTP propio, p. ej. Resend).
// Hasta entonces se usa una cuenta de ejemplo ya creada (ver docs/pruebas.md) como cliente.
const conCorreo = process.env.PRUEBA_REGISTRO === "1";
const clienteExistente = process.env.PRUEBA_CLIENTE ?? "ejemplo-cliente@autonomialab.test";
test.skip(!email || !password, "Sin credenciales de prueba (PRUEBA_EMAIL / PRUEBA_PASSWORD)");

test("crear cuenta → alta de cliente → marca, módulo y persona", async ({ page, browser }) => {
  const marca = Date.now().toString(36);
  const correoCliente = conCorreo ? `ejemplo-registro-${marca}@autonomialab.com` : clienteExistente;
  const nombreNegocio = `Ejemplo Bar ${marca}`;

  // 1. Un visitante crea su cuenta.
  if (conCorreo) {
    const visitante = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await visitante.goto("/registro");
    await visitante.getByLabel("Correo").fill(correoCliente);
    await visitante.getByLabel("Contraseña", { exact: true }).fill(`Ejemplo-${marca}-clave`);
    await visitante.getByLabel("Repite la contraseña").fill(`Ejemplo-${marca}-clave`);
    await visitante.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(visitante.getByRole("status")).toContainText("Te hemos enviado un correo");
    await visitante.screenshot({ path: "test-results/real-registro-enviado.png" });

    // Sin confirmar el correo no puede entrar.
    await visitante.goto("/");
    await visitante.getByPlaceholder("Correo").fill(correoCliente);
    await visitante.getByPlaceholder("Contraseña").fill(`Ejemplo-${marca}-clave`);
    await visitante.getByRole("button", { name: "Entrar" }).click();
    await expect(visitante.getByRole("alert").filter({ hasText: "no has confirmado tu correo" })).toBeVisible();
    await visitante.close();
  }

  // 2. Carlos entra y lo da de alta como cliente.
  await page.goto("/");
  await page.getByPlaceholder("Correo").fill(email!);
  await page.getByPlaceholder("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/miembros$/);
  await page.getByRole("link", { name: /Administración de autonomIA Lab/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("listitem").filter({ hasText: correoCliente }).first()).toBeVisible();
  await page.screenshot({ path: "test-results/real-admin.png", fullPage: true });

  await page.getByLabel("Nuevo cliente: su correo").fill(correoCliente);
  await page.getByLabel(/Nombre del negocio/).fill(nombreNegocio);
  await page.getByRole("button", { name: "Dar de alta" }).click();
  await expect(page).toHaveURL(/\/admin\/empresas\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(nombreNegocio);
  await expect(page.getByRole("listitem").filter({ hasText: correoCliente }).first()).toContainText("Admin");

  // 3. Marca, módulo y persona.
  await page.getByLabel("Nombre de su app").fill("Ejemplo Carta");
  await page.getByRole("button", { name: "Guardar marca" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Guardado." })).toBeVisible();

  const hosteleria = page.getByRole("listitem").filter({ hasText: "Hostelería" });
  await hosteleria.getByRole("button", { name: "Activar" }).click();
  await expect(hosteleria.getByText("Activo", { exact: true })).toBeVisible();

  await page.getByLabel("Correo").fill(`nadie-${marca}@autonomialab.test`);
  await page.getByRole("button", { name: "Añadir persona" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Pídele que se registre" })).toBeVisible();

  const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(extra).toBeLessThanOrEqual(0);
  await page.screenshot({ path: "test-results/real-empresa.png", fullPage: true });

  // Un correo sin cuenta no se puede dar de alta.
  await page.getByRole("link", { name: "← Clientes" }).click();
  await page.getByLabel("Nuevo cliente: su correo").fill(`nadie-${marca}@autonomialab.test`);
  await page.getByRole("button", { name: "Dar de alta" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "todavía no tiene cuenta" })).toBeVisible();

  // 4. Salir.
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/$/);
});
