import { expect, test } from "@playwright/test";

// Flujo completo contra el Supabase real. Solo corre con un usuario de prueba superadmin (ver docs/pruebas.md):
//   PRUEBA_EMAIL=… PRUEBA_PASSWORD=… npm run test:e2e
// Crea datos de ejemplo: una solicitud y un usuario ejemplo-solicitud-…@autonomialab.test y un cliente "Ejemplo Bar …".
const email = process.env.PRUEBA_EMAIL;
const password = process.env.PRUEBA_PASSWORD;
test.skip(!email || !password, "Sin credenciales de prueba (PRUEBA_EMAIL / PRUEBA_PASSWORD)");

test("solicitar acceso → aprobar → alta de cliente → marca, módulo y persona", async ({ page, browser }) => {
  const marca = Date.now().toString(36);
  const correo = `ejemplo-solicitud-${marca}@autonomialab.test`;
  const nombreNegocio = `Ejemplo Bar ${marca}`;

  // 1. Un visitante pide acceso solo con su correo y luego cuenta a qué se dedica.
  const visitante = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await visitante.goto("/");
  await visitante.getByRole("link", { name: /Solicitar acceso/ }).click();
  await visitante.getByLabel("Correo").fill(correo);
  await visitante.getByRole("button", { name: "Solicitar acceso" }).click();
  await expect(visitante).toHaveURL(/\/solicitud\/[0-9a-f-]{36}$/);
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
  await page.goto("/");
  await page.getByPlaceholder("Correo").fill(email!);
  await page.getByPlaceholder("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/miembros$/);
  await page.getByRole("link", { name: /Administración de autonomIA Lab/ }).click();
  await expect(page).toHaveURL(/\/admin$/);

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

  // 3. Lo da de alta como cliente.
  await page.getByLabel("Nuevo cliente: su correo").fill(correo);
  await page.getByLabel(/Nombre del negocio/).fill(nombreNegocio);
  await page.getByRole("button", { name: "Dar de alta" }).click();
  await expect(page).toHaveURL(/\/admin\/empresas\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(nombreNegocio);
  await expect(page.getByRole("listitem").filter({ hasText: correo }).first()).toContainText("Admin");

  // 4. Marca, módulo y persona.
  await page.getByLabel("Nombre de su app").fill("Ejemplo Carta");
  await page.getByRole("button", { name: "Guardar marca" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Guardado." })).toBeVisible();
  const hosteleria = page.getByRole("listitem").filter({ hasText: "Hostelería" });
  await hosteleria.getByRole("button", { name: "Activar" }).click();
  await expect(hosteleria.getByText("Activo", { exact: true })).toBeVisible();
  await page.getByLabel("Correo").fill(`nadie-${marca}@autonomialab.test`);
  await page.getByRole("button", { name: "Añadir persona" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "todavía no tiene acceso" })).toBeVisible();
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(extra).toBeLessThanOrEqual(0);
  await page.screenshot({ path: "test-results/real-empresa.png", fullPage: true });

  // 5. Salir. Ese correo ya no puede volver a pedir acceso.
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/solicitar");
  await page.getByLabel("Correo").fill(correo);
  await page.getByRole("button", { name: "Solicitar acceso" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "ya tiene acceso" })).toBeVisible();
});
