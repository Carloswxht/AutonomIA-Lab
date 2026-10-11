import { expect, test } from "@playwright/test";

// Flujo completo contra el Supabase real. Solo corre si hay credenciales de un usuario de prueba superadmin:
//   PRUEBA_EMAIL=… PRUEBA_PASSWORD=… npm run test:e2e
// Crea datos de ejemplo (una solicitud y una empresa con "Ejemplo" en el nombre).
const email = process.env.PRUEBA_EMAIL;
const password = process.env.PRUEBA_PASSWORD;
test.skip(!email || !password, "Sin credenciales de prueba (PRUEBA_EMAIL / PRUEBA_PASSWORD)");

test("solicitud → aprobar → marca, módulo y persona", async ({ page, browser }) => {
  const marca = Date.now().toString(36);
  const correoCliente = `ejemplo-cliente-${marca}@autonomialab.test`;
  const nombreEmpresa = `Ejemplo Bar ${marca}`;

  // 1. Un visitante solicita cuenta.
  const visitante = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await visitante.goto("/solicitar");
  await visitante.getByLabel("Nombre").fill("Ejemplo Cliente");
  await visitante.getByLabel("Correo").fill(correoCliente);
  await visitante.getByLabel(/Empresa/).fill(nombreEmpresa);
  await visitante.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(visitante.getByRole("status")).toContainText("Solicitud enviada");
  await visitante.screenshot({ path: "test-results/real-solicitud-enviada.png" });
  await visitante.close();

  // 2. Carlos entra.
  await page.goto("/");
  await page.getByPlaceholder("Correo").fill(email!);
  await page.getByPlaceholder("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/miembros$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hola");
  await page.screenshot({ path: "test-results/real-miembros.png", fullPage: true });

  // 3. Ve la solicitud en su panel y la aprueba.
  await page.getByRole("link", { name: /Administración de autonomIA Lab/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const tarjeta = page.getByRole("listitem").filter({ hasText: correoCliente });
  await expect(tarjeta).toBeVisible();
  await page.screenshot({ path: "test-results/real-admin.png", fullPage: true });
  await tarjeta.getByRole("button", { name: "Aprobar y crear empresa" }).click();
  await expect(page).toHaveURL(/\/admin\/empresas\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(nombreEmpresa);

  // 4. Marca, módulo y persona.
  await page.getByLabel("Nombre de su app").fill("Ejemplo Carta");
  await page.getByRole("button", { name: "Guardar marca" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Guardado." })).toBeVisible();

  const hosteleria = page.getByRole("listitem").filter({ hasText: "Hostelería" });
  await hosteleria.getByRole("button", { name: "Activar" }).click();
  await expect(hosteleria.getByText("Activo", { exact: true })).toBeVisible();

  await page.getByLabel("Correo").fill(email!);
  await page.getByRole("button", { name: "Añadir persona" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Ejemplo Pruebas" })).toBeVisible();

  // Si el correo no existe, lo explica.
  await page.getByLabel("Correo").fill(`nadie-${marca}@autonomialab.test`);
  await page.getByRole("button", { name: "Añadir persona" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No hay ningún usuario con ese correo" })).toBeVisible();

  const anchoExtra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(anchoExtra).toBeLessThanOrEqual(0);
  await page.screenshot({ path: "test-results/real-empresa.png", fullPage: true });

  // 5. Salir.
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/$/);
});
