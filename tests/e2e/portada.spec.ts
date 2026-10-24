import { expect, test } from "@playwright/test";

// Estos tests funcionan con o sin conexión a Supabase: comprueban pantallas, validaciones y errores.

const sinScrollLateral = async (page: import("@playwright/test").Page) => {
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(extra).toBeLessThanOrEqual(0);
};

test("la portada muestra marca, acceso, servicios por perfil y asesor", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("autonomIA Lab").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nuestros servicios");
  await expect(page.getByText("Esto es lo que puede hacer")).toHaveCount(0);
  for (const [nombre, clave] of [["Autónomos", "autonomos"], ["Pymes", "pymes"], ["Empresas", "empresas"]])
    await expect(page.getByRole("link", { name: new RegExp(`^${nombre} `) })).toHaveAttribute("href", `/servicios/?para=${clave}`);
  await expect(page.getByText("¿Para quién es?")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Trabajas por tu cuenta/ })).toBeVisible();
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

test("un enlace de correo que llega a la portada pasa a /auth/confirmar", async ({ page }) => {
  await page.goto("/?token_hash=falso&type=recovery");
  await expect(page).toHaveURL(/\/confirmado\/\?motivo=contrasena$/);
});

test("Recuperar contraseña pide un correo válido", async ({ page }) => {
  await page.goto("/recuperar");
  await page.getByLabel("Correo").fill("ejemplo@sin-punto");
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Revisa el correo" })).toBeVisible();
});

test("la página de servicios enseña los 9 servicios, los productos y lleva a WhatsApp", async ({ page }) => {
  await page.goto("/servicios/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("en tu negocio");
  for (const t of ["Agentes de IA", "Automatizaciones", "Diagnóstico de IA", "Formación en IA", "Aplicaciones web empresariales a medida", "CRM a medida", "Páginas web profesionales", "Alojamiento y mantenimiento", "Ficha de Google y reseñas"])
    await expect(page.getByRole("heading", { name: t, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "¿Agente o automatización?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /MultiBar/ })).toHaveAttribute("href", "https://carta.autonomialab.es");
  await expect(page.getByRole("link", { name: "Pedir un diagnóstico" })).toHaveAttribute("href", /^https:\/\/wa\.me\/34605288673\?text=/);
  await sinScrollLateral(page);
  await page.screenshot({ path: "test-results/servicios-390.png", fullPage: true });
});

test("servicios cambia según el perfil, lo recuerda y se puede volver a la versión para todos", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /^Autónomos / }).click();
  await expect(page).toHaveURL(/\/servicios\/\?para=autonomos$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Haces de todo. Que lo repetitivo se haga solo.");
  await expect(page.getByRole("group", { name: "Ver para:" }).getByRole("button", { name: "Autónomos" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("h3").first()).toHaveText("Diagnóstico de IA");
  await expect(page.getByText("Para ti").first()).toBeVisible();
  await sinScrollLateral(page);
  await page.screenshot({ path: "test-results/servicios-autonomos-390.png", fullPage: true });

  await page.getByRole("button", { name: "Empresas" }).click();
  await expect(page).toHaveURL(/\?para=empresas$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("integradas en cómo ya trabajáis");
  await expect(page.locator("h3").nth(1)).toHaveText("Aplicaciones web empresariales a medida");
  await expect(page.getByRole("link", { name: "Contactar por WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/34605288673\?text=/);
  await page.screenshot({ path: "test-results/servicios-empresas-390.png", fullPage: true });

  // Sin ?para=, el móvil recuerda el último perfil.
  await page.goto("/servicios/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("integradas en cómo ya trabajáis");
  await page.getByRole("button", { name: "Ver la página para todos" }).click();
  await expect(page).toHaveURL(/\/servicios\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("en tu negocio");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("en tu negocio");

  await page.goto("/servicios/?para=pymes");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tu equipo, tus clientes y tus datos, en orden.");
  await page.goto("/servicios/?para=otra");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("en tu negocio");
});
