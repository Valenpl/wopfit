import { expect, test } from '@playwright/test';
import { loginAs, newUser, shot } from './helpers.js';

// Regla del README: cada pantalla pide cada dato al backend una sola vez, aun con el doble efecto de StrictMode.
const SCREENS = ['/inicio', '/entreno', '/comida', '/progreso', '/metas', '/historial', '/perfil', '/perfil/cuenta', '/comunidad', '/planes', '/ofertas', '/cerca', '/profesionales', '/profesionales/1', '/wopi', '/instalar'];

let token;

test.beforeAll(async ({ request }) => {
  ({ token } = await newUser(request, { goals: ['mover', 'comer'], days: [0, 1, 2, 3, 4, 5, 6] }));
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

test.beforeEach(({ page }) => loginAs(page, token));

for (const path of SCREENS) {
  test(`${path}: ningún pedido repetido al cargar`, async ({ page }) => {
    const seen = track(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.tabbar')).toBeVisible();
    expect(seen).toContain('GET /api/v1/users/me');
    await shot(page, `pantalla${path.replaceAll('/', '_')}`);
    expect(repeated(seen), `pedidos: ${seen.join(', ')}`).toEqual([]);
  });
}

test('"Plan listo" sin plan lo crea una sola vez', async ({ page, request }) => {
  const { token: t } = await newUser(request, { name: 'Sin plan', days: [1, 3], plan: false });

  const ctx = await page.context().browser().newContext({ baseURL: 'http://localhost:5173' });
  const p2 = await ctx.newPage();
  await loginAs(p2, t);
  const seen = track(p2);
  await p2.goto('/plan-listo');
  await expect(p2.getByRole('heading', { name: '¡Tu plan está listo!' })).toBeVisible();
  await p2.waitForLoadState('networkidle');
  expect(seen.filter(x => x === 'POST /api/v1/users/me/plan'), seen.join(', ')).toHaveLength(1);
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
