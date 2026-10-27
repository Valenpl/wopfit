import { expect, test } from '@playwright/test';

// Navegación como la v6, pantalla Cuenta y lista del súper, contra el backend real.
const API = 'http://localhost:8080/api';
const PASS = 'clave1234';
let token, email;

test.beforeAll(async ({ request }) => {
  email = `e2e-nav-${Date.now()}@wopfit.test`;
  const call = async (method, path, data) => {
    const res = await request.fetch(API + path, { method, data, headers: token ? { Authorization: 'Bearer ' + token } : {} });
    expect(res.ok(), `${method} ${path} → ${res.status()}`).toBeTruthy();
    return res.json();
  };
  const { devCode } = await call('POST', '/auth/register', { email, password: PASS });
  ({ token } = await call('POST', '/auth/verify', { email, code: devCode }));
  await call('PUT', '/me/about', { name: 'Nav', birthDate: '1995-03-10', heightCm: 170, weightKg: 68 });
  await call('PUT', '/me/preferences', {
    goals: ['comer'], days: [0, 2, 4], minutes: 30, budget: 'medio', activities: [], avoid: ['tacc'], otherAvoid: '', health: [], level: 'principiante', equipment: ['nada']
  });
  await call('POST', '/plan');
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(t => { localStorage.setItem('wopfit-token', t); }, token);
});

const tabs = page => page.locator('.tabbar');

test('pestañas de la v6 y accesos rápidos', async ({ page }) => {
  await page.goto('/inicio');
  await expect(tabs(page).getByRole('button')).toHaveText(['Inicio', 'Entreno', 'Comida', 'Comunidad', 'Perfil', 'Preguntale a Wopi', 'Pasate a Premium', 'Ver versión celu']);
  for (const [label, path, heading] of [['Preguntale a Wopi', '/wopi'], ['Ofertas', '/ofertas', 'Encontrar ofertas'], ['Cerca tuyo', '/cerca', 'Cerca tuyo'], ['Ayuda profesional', '/profesionales', 'Ayuda profesional']]) {
    await page.locator('.qa').getByRole('button', { name: label }).click();
    await expect(page).toHaveURL(path);
    if (heading) await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    else await expect(page.getByText('Estamos armando esta sección')).toBeVisible();
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page).toHaveURL('/inicio');
  }
  await page.getByRole('button', { name: /Ver progreso/ }).click();
  await expect(page.getByRole('heading', { name: 'Tu progreso' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver' }).click();
  await expect(page).toHaveURL('/inicio');
});

test('versión celu y compu', async ({ page }) => {
  await page.goto('/perfil');
  await expect(page.locator('html')).toHaveClass(/desk/);
  await tabs(page).getByRole('button', { name: 'Ver versión celu' }).click();
  await expect(page.locator('html')).not.toHaveClass(/desk/);
  await page.screenshot({ path: 'test-results/perfil-celu.png', fullPage: true });
  await page.reload();
  await expect(page.locator('html')).not.toHaveClass(/desk/); // se recuerda
  await page.getByRole('button', { name: /Ver versión compu/ }).click();
  await expect(page.locator('html')).toHaveClass(/desk/);
});

test('perfil tiene las secciones de la v6', async ({ page }) => {
  await page.goto('/perfil');
  await expect(page.locator('.sect h2')).toHaveText(['Mi plan', 'Mis preferencias', 'Mis datos', 'Más']);
  await expect(page.getByText('Plan Gratuito')).toBeVisible();
  for (const t of ['Suscripción', 'Ayuda profesional', 'Cuenta', 'Ofertas y cupones', 'Cerca tuyo', 'Instalar la app en tu celu']) {
    await expect(page.locator('.listrow').filter({ hasText: t }).first()).toBeVisible();
  }
  await page.screenshot({ path: 'test-results/perfil-compu.png', fullPage: true });
});

test('lista del súper: tildar se guarda en el backend', async ({ page }) => {
  await page.goto('/comida');
  await page.locator('.seg').getByRole('button', { name: 'Súper' }).click();
  await expect(page.getByRole('heading', { name: 'Tu lista del súper' })).toBeVisible();
  const rows = page.locator('.listrow');
  expect(await rows.count()).toBeGreaterThan(3);
  await expect(page.getByText(/avena/i)).toHaveCount(0); // sin TACC
  const first = rows.first();
  await expect(first).toHaveAttribute('aria-pressed', 'false');
  const saved = page.waitForResponse(r => r.url().includes('/api/shopping/') && r.request().method() === 'PUT');
  await first.click();
  expect((await saved).ok()).toBeTruthy();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.card .tag.blue').first()).toHaveText(/^1\/\d+$/);
  await page.screenshot({ path: 'test-results/comida-super.png', fullPage: true });
  await page.reload(); // la pestaña Súper queda elegida y lo tildado sigue tildado
  await expect(page.locator('.listrow').first()).toHaveAttribute('aria-pressed', 'true');
});

test('cuenta: cambiar la contraseña', async ({ page, request }) => {
  await page.goto('/perfil');
  await page.locator('.listrow').filter({ hasText: 'Cuenta' }).click();
  await expect(page).toHaveURL('/perfil/cuenta');
  await expect(page.getByLabel('Email')).toHaveValue(email);
  await expect(page.getByLabel('Email')).toBeDisabled();

  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Escribí tu contraseña actual')).toBeVisible();

  await page.getByLabel('Contraseña actual').fill('incorrecta1');
  await page.getByLabel('Nueva contraseña').fill('nueva12345');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.toast')).toHaveText('Tu contraseña actual no coincide');
  await expect(page).toHaveURL('/perfil/cuenta'); // sigue con la sesión iniciada

  await page.getByLabel('Contraseña actual').fill(PASS);
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('.toast')).toHaveText('Contraseña actualizada');
  await expect(page).toHaveURL('/perfil');

  const old = await request.post(API + '/auth/login', { data: { email, password: PASS } });
  expect(old.status()).toBe(401);
  const ok = await request.post(API + '/auth/login', { data: { email, password: 'nueva12345' } });
  expect(ok.ok()).toBeTruthy();
});
