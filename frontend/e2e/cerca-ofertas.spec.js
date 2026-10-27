import { expect, test } from '@playwright/test';

// Cerca tuyo (mapa real, Premium) y Ofertas, con los datos de demostración del backend.
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
    goals: ['comer'], days: [0, 2, 4], minutes: 30, budget: 'bajo', activities: [], avoid: [], otherAvoid: '', health: [], level: 'principiante', equipment: ['nada']
  });
  await call('POST', '/plan');
  if (premium) await call('POST', '/subscription', { period: 'anual' });
  return token;
}

test.beforeAll(async ({ request }) => {
  users.free = await newUser(request, 'Libre', false);
  users.prem = await newUser(request, 'Prem', true);
});

/** Captura para revisar a ojo; nunca hace fallar el test. */
const shot = (page, name) => page.screenshot({ path: `test-results/${name}.png`, timeout: 10000 }).catch(() => {});

const as = (page, who) => page.addInitScript(t => localStorage.setItem('wopfit-token', t), users[who]);

test.describe('con la ubicación en Palermo', () => {
  test.use({ geolocation: { latitude: -34.5878, longitude: -58.4300 }, permissions: ['geolocation'] });

  test('Premium: mapa real con los lugares más cercanos primero', async ({ page }) => {
    await as(page, 'prem');
    await page.goto('/cerca');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.leaflet-tile-pane img').first()).toBeAttached(); // teselas de OpenStreetMap
    await expect(page.locator('.lpin')).toHaveCount(45);
    await expect(page.locator('.place').first()).toContainText('Palermo');
    await expect(page.locator('.place').first()).toContainText(/a \d+ m/);
    await expect(page.getByText('Activá la ubicación')).toHaveCount(0);
    await expect(page.locator('.place')).toHaveCount(12);
    await shot(page, 'cerca-premium');

    await page.locator('.chiprow').getByRole('button', { name: /Gimnasios/ }).click();
    await expect(page.locator('.lpin')).toHaveCount(9);
    for (const t of await page.locator('.place').allInnerTexts()) expect(t).toContain('Gimnasios');
    await page.locator('.chiprow').getByRole('button', { name: /Todos/ }).click();
    await page.getByRole('button', { name: 'Con descuento' }).click();
    await expect(page.locator('.place').filter({ hasText: /Verdulería El Huerto|Parque|Plaza|Barrancas/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Con descuento' }).click();

    await page.getByLabel('Buscar lugares').fill('belgrano');
    await expect(page.locator('.place').first()).toContainText('Belgrano');
    await page.getByLabel('Buscar lugares').fill('');

    await page.locator('.lpin').first().click();
    await expect(page.locator('.place.sel')).toHaveCount(1);
    const href = await page.locator('.place').first().getByRole('link', { name: /Cómo llegar/ }).getAttribute('href');
    expect(href).toContain('openstreetmap.org/directions');
  });

  test('Ofertas: distancia a la sucursal más cercana y "Ver en el mapa"', async ({ page }) => {
    await as(page, 'prem');
    await page.goto('/ofertas');
    await expect(page.getByText(/Alertas de ofertas activadas/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Para tu lista de esta semana' })).toBeVisible();
    const all = page.locator('.coupon');
    expect(await all.count()).toBeGreaterThanOrEqual(10);
    await expect(page.locator('.coupon').filter({ hasText: 'Deportes Andes' })).toContainText('Online');
    const gym = page.locator('.coupon').filter({ hasText: 'Gimnasio Impulso' }).first();
    await expect(gym).toContainText(/Gimnasio Impulso · a [\d,]+ (m|km)/);
    await shot(page, 'ofertas');

    await page.getByLabel('Buscar ofertas').fill('zapatillas');
    await expect(page.locator('.coupon')).toHaveCount(1);
    await page.getByLabel('Buscar ofertas').fill('');
    await gym.getByRole('button', { name: /Ver en el mapa/ }).click();
    await expect(page).toHaveURL(/\/cerca\?lugar=\d+/);
    await expect(page.locator('.place.sel')).toContainText('Gimnasio Impulso');
    await expect(page.locator('.place.sel')).toContainText('Palermo'); // la sucursal más cercana
  });
});

test('sin ubicación se centra en UADE', async ({ page }) => {
  await as(page, 'prem');
  await page.goto('/cerca');
  await expect(page.getByText('Te mostramos los lugares cerca de UADE (Monserrat)')).toBeVisible();
  await expect(page.locator('.place').first()).toContainText(/Monserrat|San Nicolás|Congreso/);
});

test('Gratuito: el mapa queda bloqueado y no pide lugares', async ({ page }) => {
  await as(page, 'free');
  const asked = [];
  page.on('request', r => { if (r.url().includes('/api/places')) asked.push(r.url()); });
  await page.goto('/cerca');
  await expect(page.getByText('El buscador de lugares cercanos es parte de Premium')).toBeVisible();
  await expect(page.locator('.lpin')).toHaveCount(0);
  await page.goto('/ofertas');
  await expect(page.getByRole('button', { name: /Activá alertas de ofertas con Premium/ })).toBeVisible();
  expect(asked).toEqual([]);
});

test('Comida: ofertas para tu lista', async ({ page }) => {
  await as(page, 'free');
  await page.goto('/comida');
  await page.locator('.seg').getByRole('button', { name: 'Hoy' }).click();
  await expect(page.getByRole('heading', { name: 'Ofertas para tu lista' })).toBeVisible();
  await expect(page.locator('.coupon')).toHaveCount(1);
  await page.locator('.seg').getByRole('button', { name: 'Súper' }).click();
  await expect(page.getByRole('button', { name: /ofertas? para ingredientes de tu lista/ })).toBeVisible();
  expect(await page.locator('.listrow .tag').filter({ hasText: 'Oferta' }).count()).toBeGreaterThan(0);
});
