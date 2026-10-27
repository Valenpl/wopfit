import { expect, test } from '@playwright/test';

// Ayuda profesional: con Premium se reservan 2 consultas por mes; sin Premium se ve todo pero no se reserva.
const API = 'http://localhost:8080/api';
const users = {};

async function newUser(request, name, premium) {
  let token;
  const email = `e2e-${name}-${Date.now()}@wopfit.test`;
  const call = async (method, path, data) => {
    const res = await request.fetch(API + path, { method, data, headers: token ? { Authorization: 'Bearer ' + token } : {} });
    expect(res.ok(), `${method} ${path} → ${res.status()}`).toBeTruthy();
    return res.json();
  };
  const { devCode } = await call('POST', '/auth/register', { email, password: 'clave1234' });
  ({ token } = await call('POST', '/auth/verify', { email, code: devCode }));
  await call('PUT', '/me/about', { name, birthDate: '1995-03-10', heightCm: 170, weightKg: 68 });
  await call('PUT', '/me/preferences', {
    goals: ['mover'], days: [0, 2, 4], minutes: 30, budget: 'bajo', activities: [], avoid: [], otherAvoid: '', health: [], level: 'principiante', equipment: ['nada']
  });
  await call('POST', '/plan');
  if (premium) await call('POST', '/subscription', { period: 'mensual' });
  return token;
}

test.beforeAll(async ({ request }) => {
  users.free = await newUser(request, 'ProLibre', false);
  users.prem = await newUser(request, 'ProPrem', true);
});

const as = (page, who) => page.addInitScript(t => localStorage.setItem('wopfit-token', t), users[who]);
const shot = (page, name) => page.screenshot({ path: `test-results/${name}.png`, timeout: 10000 }).catch(() => {});

/** Abre un profesional, elige Chat y el primer horario libre del día elegido, y confirma. */
async function book(page, name) {
  await page.getByRole('button', { name: new RegExp(name) }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await page.getByRole('button', { name: /Chat/ }).click();
  await expect(page.locator('.grid3 .slot.on')).toHaveCount(1); // viene elegido el primer turno libre
  await page.getByRole('button', { name: 'Confirmar consulta' }).click();
  await expect(page).toHaveURL('/profesionales/confirmada');
}

test('Gratuito: ve los profesionales pero para reservar tiene que pasarse a Premium', async ({ page }) => {
  await as(page, 'free');
  await page.goto('/profesionales');
  await expect(page.getByRole('button', { name: /2 consultas por mes incluidas en Premium/ })).toBeVisible();
  await expect(page.locator('button.pro')).toHaveCount(3);
  await page.getByRole('button', { name: 'Entrenadores' }).click();
  await expect(page.locator('button.pro')).toHaveCount(3);
  await expect(page.locator('button.pro').first()).toContainText(/Próximo turno: /);
  await page.locator('button.pro').first().click();
  await expect(page.getByText('Las consultas con profesionales están incluidas en Premium.')).toBeVisible();
  await page.getByRole('button', { name: 'Mejorar plan para reservar' }).click();
  await expect(page).toHaveURL('/planes');
});

test('Premium: reservar 2 consultas, agregar al calendario y cancelar', async ({ page }) => {
  await as(page, 'prem');
  await page.goto('/profesionales');
  await expect(page.getByText('Te quedan 2 consultas este mes')).toBeVisible();

  await page.getByRole('button', { name: /Lic. Carolina Méndez/ }).click();
  await expect(page.locator('.grid2 .slot')).toHaveCount(2 + 4); // 2 modalidades + 4 días
  await expect(page.locator('.grid3 .slot')).toHaveCount(5);
  await shot(page, 'profesional');
  await page.getByRole('button', { name: 'Volver' }).click();

  await book(page, 'Lic. Carolina Méndez');
  await expect(page.getByRole('heading', { name: '¡Consulta confirmada!' })).toBeVisible();
  await expect(page.getByText('Te queda 1 consulta este mes.')).toBeVisible();
  await expect(page.getByText('Chat', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Agregar al calendario/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('consulta-wopfit.ics');
  await shot(page, 'consulta-confirmada');

  await page.goto('/profesionales');
  await expect(page.getByRole('heading', { name: 'Mis consultas' })).toBeVisible();
  await expect(page.locator('.pro').filter({ hasText: 'Confirmada' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Entrenadores' }).click();
  await book(page, 'Prof. Julieta Ríos');
  await expect(page.getByText('Te quedan 0 consultas este mes.')).toBeVisible();

  // sin cupo: el botón queda deshabilitado
  await page.goto('/profesionales');
  await expect(page.getByText('Te quedan 0 consultas este mes')).toBeVisible();
  await page.getByRole('button', { name: /Lic. Tomás Ferreyra/ }).click();
  await expect(page.getByRole('button', { name: 'Sin consultas este mes' })).toBeDisabled();
  await page.goto('/perfil');
  await expect(page.locator('.listrow').filter({ hasText: 'Ayuda profesional' })).toContainText('0 consultas disponibles este mes');

  // cancelar una devuelve el cupo
  await page.goto('/profesionales');
  page.once('dialog', d => d.accept());
  await page.locator('.pro').filter({ hasText: 'Carolina Méndez' }).getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.locator('.toast')).toHaveText('Consulta cancelada');
  await expect(page.getByText('Te queda 1 consulta este mes')).toBeVisible();
  await expect(page.locator('.pro').filter({ hasText: 'Confirmada' })).toHaveCount(1);
});
