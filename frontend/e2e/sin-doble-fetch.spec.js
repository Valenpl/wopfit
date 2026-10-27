import { expect, test } from '@playwright/test';

// Regla del README: cada pantalla pide cada dato al backend una sola vez, aun con el doble efecto de StrictMode.
const API = 'http://localhost:8080/api';
const SCREENS = ['/inicio', '/entreno', '/comida', '/progreso', '/metas', '/historial', '/perfil', '/perfil/cuenta', '/comunidad'];

let token;

test.beforeAll(async ({ request }) => {
  const email = `e2e-${Date.now()}@wopfit.test`;
  const call = async (method, path, data) => {
    const res = await request.fetch(API + path, { method, data, headers: token ? { Authorization: 'Bearer ' + token } : {} });
    expect(res.ok(), `${method} ${path} → ${res.status()}`).toBeTruthy();
    return res.json();
  };
  const { devCode } = await call('POST', '/auth/register', { email, password: 'clave1234' });
  ({ token } = await call('POST', '/auth/verify', { email, code: devCode }));
  await call('PUT', '/me/about', { name: 'Prueba', birthDate: '1995-03-10', heightCm: 170, weightKg: 68 });
  await call('PUT', '/me/preferences', {
    goals: ['mover', 'comer'], days: [0, 1, 2, 3, 4, 5, 6], minutes: 30, budget: 'bajo', activities: ['caminar'],
    avoid: [], otherAvoid: '', health: [], level: 'principiante', equipment: ['nada']
  });
  await call('POST', '/plan');
});

/** Anota cada pedido a /api con método y ruta completa (incluye query). */
function track(page) {
  const seen = [];
  page.on('request', r => {
    const u = new URL(r.url());
    if (u.pathname.startsWith('/api/')) seen.push(`${r.method()} ${u.pathname}${u.search}`);
  });
  return seen;
}

const repeated = list => [...new Set(list.filter((x, i) => list.indexOf(x) !== i))];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(t => localStorage.setItem('wopfit-token', t), token);
});

for (const path of SCREENS) {
  test(`${path}: ningún pedido repetido al cargar`, async ({ page }) => {
    const seen = track(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.tabbar')).toBeVisible();
    expect(seen).toContain('GET /api/me');
    await page.screenshot({ path: `test-results/pantalla${path.replaceAll('/', '_')}.png`, fullPage: true });
    expect(repeated(seen), `pedidos: ${seen.join(', ')}`).toEqual([]);
  });
}

test('"Plan listo" sin plan lo crea una sola vez', async ({ page, request }) => {
  const email = `e2e-ready-${Date.now()}@wopfit.test`;
  let t;
  const call = async (method, path, data) => {
    const res = await request.fetch(API + path, { method, data, headers: t ? { Authorization: 'Bearer ' + t } : {} });
    expect(res.ok(), `${method} ${path} → ${res.status()}`).toBeTruthy();
    return res.json();
  };
  const { devCode } = await call('POST', '/auth/register', { email, password: 'clave1234' });
  ({ token: t } = await call('POST', '/auth/verify', { email, code: devCode }));
  await call('PUT', '/me/about', { name: 'Sin plan', birthDate: '1995-03-10', heightCm: 170, weightKg: 68 });
  await call('PUT', '/me/preferences', {
    goals: ['mover'], days: [1, 3], minutes: 30, budget: 'bajo', activities: [], avoid: [], otherAvoid: '', health: [], level: 'principiante', equipment: ['nada']
  });

  const ctx = await page.context().browser().newContext({ baseURL: 'http://localhost:5173' });
  const p2 = await ctx.newPage();
  await p2.addInitScript(tok => localStorage.setItem('wopfit-token', tok), t);
  const seen = track(p2);
  await p2.goto('/plan-listo');
  await expect(p2.getByRole('heading', { name: '¡Tu plan está listo!' })).toBeVisible();
  await p2.waitForLoadState('networkidle');
  expect(seen.filter(x => x === 'POST /api/plan'), seen.join(', ')).toHaveLength(1);
  await ctx.close();
});

test('navegar por las pestañas no repite pedidos dentro de cada pantalla', async ({ page }) => {
  await page.goto('/inicio');
  await page.waitForLoadState('networkidle');
  for (const name of ['Entreno', 'Comida', 'Comunidad', 'Perfil', 'Inicio']) {
    const seen = track(page);
    await page.locator('.tabbar').getByRole('button', { name, exact: true }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    expect(repeated(seen), `${name}: ${seen.join(', ')}`).toEqual([]);
    page.removeAllListeners('request');
  }
});
