import { expect, test } from '@playwright/test';

// Premium de demostración: se activa sin pagar y cambia lo que se ve en Inicio, Perfil y la barra lateral.
const API = 'http://localhost:8080/api';
let token;

test.beforeAll(async ({ request }) => {
  const email = `e2e-prem-${Date.now()}@wopfit.test`;
  const call = async (method, path, data) => {
    const res = await request.fetch(API + path, { method, data, headers: token ? { Authorization: 'Bearer ' + token } : {} });
    expect(res.ok(), `${method} ${path} → ${res.status()}`).toBeTruthy();
    return res.json();
  };
  const { devCode } = await call('POST', '/auth/register', { email, password: 'clave1234' });
  ({ token } = await call('POST', '/auth/verify', { email, code: devCode }));
  await call('PUT', '/me/about', { name: 'Prem', birthDate: '1995-03-10', heightCm: 170, weightKg: 68 });
  await call('PUT', '/me/preferences', {
    goals: ['mover'], days: [0, 2, 4], minutes: 30, budget: 'bajo', activities: [], avoid: [], otherAvoid: '', health: [], level: 'principiante', equipment: ['nada']
  });
  await call('POST', '/plan');
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(t => localStorage.setItem('wopfit-token', t), token);
});

test('pasar a Premium sin pagar y volver al Gratuito', async ({ page }) => {
  // Gratuito: candados, anuncio y "Pasate a Premium"
  await page.goto('/inicio');
  await expect(page.locator('.qa .lk')).toHaveCount(2);
  await expect(page.locator('.ad')).toContainText('Anuncio de aliado');
  await page.locator('.tabbar').getByRole('button', { name: 'Pasate a Premium' }).click();

  await expect(page.getByRole('heading', { name: 'Elegí tu plan' })).toBeVisible();
  await expect(page.getByText('No se cobra nada')).toBeVisible();
  await expect(page.locator('.per.on')).toContainText('Anual');
  await page.getByRole('button', { name: /Ver todos los beneficios/ }).click();
  await expect(page.locator('.plan.rec li')).toHaveCount(8);
  await page.locator('.per').filter({ hasText: 'Semestral' }).click();
  await page.screenshot({ path: 'test-results/planes.png', fullPage: true });
  await page.getByRole('button', { name: /Pasarme a Premium/ }).click();

  await expect(page).toHaveURL('/premium');
  await expect(page.getByRole('heading', { name: '¡Ya sos Premium!' })).toBeVisible();
  await expect(page.getByText(/Tu plan Semestral está activo hasta el \d+ de \w+ de \d{4}/)).toBeVisible();
  await page.screenshot({ path: 'test-results/ya-sos-premium.png', fullPage: true });

  // Premium: sin candados ni anuncio, ★ en la barra y en el perfil
  await page.locator('.tabbar').getByRole('button', { name: 'Inicio', exact: true }).click();
  await expect(page.locator('.qa')).toBeVisible();
  await expect(page.locator('.qa .lk')).toHaveCount(0);
  await expect(page.locator('.ad')).toHaveCount(0);
  await expect(page.locator('.tabbar .sprem')).toHaveText('★ Premium');
  await page.reload(); // se guarda en el backend
  await expect(page.locator('.tabbar .sprem')).toHaveText('★ Premium');
  await page.goto('/perfil');
  await expect(page.locator('.avatar.prem')).toBeVisible();
  await expect(page.getByText('★ Premium Semestral')).toBeVisible();
  await expect(page.locator('.listrow').filter({ hasText: 'Suscripción' })).toContainText('Premium Semestral · US$ 53,99 cada 6 meses');

  // cambiar de período y volver al Gratuito
  await page.locator('.listrow').filter({ hasText: 'Suscripción' }).click();
  await page.locator('.per').filter({ hasText: 'Mensual' }).click();
  await expect(page.getByRole('button', { name: /Cambiar a Mensual/ })).toBeVisible();
  await page.locator('.per').filter({ hasText: 'Semestral' }).click();
  await page.getByRole('button', { name: 'Volver al plan Gratuito' }).click();
  await expect(page.locator('.toast')).toHaveText('Volviste al plan Gratuito');
  await expect(page).toHaveURL('/perfil');
  await expect(page.getByText('Plan Gratuito', { exact: true })).toBeVisible();

  // sin Premium, /premium vuelve a Elegí tu plan
  await page.goto('/premium');
  await expect(page).toHaveURL('/planes');
});
