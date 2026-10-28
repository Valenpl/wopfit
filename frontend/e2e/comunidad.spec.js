import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { loginAs, newUser, shot } from './helpers.js';

// Comunidad: personas como vos, filtros, me gusta, comentarios, publicar con foto y borrar.
const PNG = readFileSync(new URL('../public/icon-192.png', import.meta.url)); // una imagen real de 192×192
let token;

test.beforeAll(async ({ request }) => {
  ({ token } = await newUser(request, { name: 'Lucía Fernández', goals: ['comer', 'mover'] }));
});

test.beforeEach(async ({ page }) => {
  await loginAs(page, token);
  await page.addInitScript(() => sessionStorage.removeItem('wopfit-cf'));
});

test('feed, seguir, filtros, me gusta y comentar', async ({ page }) => {
  await page.goto('/comunidad');
  await expect(page.getByRole('heading', { name: 'Personas como vos' })).toBeVisible();
  await expect(page.locator('.person')).toHaveCount(5);
  await expect(page.locator('.person').first()).toContainText(/También quiere (comer mejor|moverme más)/);
  await expect(page.locator('article.post').first()).toBeVisible();
  await shot(page, 'comunidad');

  // seguir queda guardado
  const first = page.locator('.person').first();
  const followed = page.waitForResponse(r => r.url().includes('/follow') && r.request().method() === 'PUT');
  await first.getByRole('button', { name: 'Seguir' }).click();
  await expect(first.getByRole('button', { name: 'Siguiendo' })).toBeVisible();
  expect((await followed).ok()).toBeTruthy();
  await page.reload();
  await expect(page.locator('.person').first().getByRole('button', { name: 'Siguiendo' })).toBeVisible();

  // filtros
  const recetas = page.waitForResponse(r => r.url().includes('/api/community?f=recetas'));
  await page.locator('.seg').getByRole('button', { name: 'Recetas' }).click();
  await recetas;
  await expect(page.locator('article.post').filter({ hasText: 'Hice la rutina exprés' })).toHaveCount(0);
  for (const t of await page.locator('article.post .tiny.muted').allInnerTexts()) expect(t).toContain('Receta');
  const para = page.waitForResponse(r => r.url().includes('/api/community?f=para'));
  await page.locator('.seg').getByRole('button', { name: 'Para vos' }).click();
  await para;

  // me gusta
  const bowl = page.locator('article.post').filter({ hasText: 'Bowl de lentejas' });
  const like = bowl.getByRole('button', { name: /Me gusta/ });
  const n = Number((await like.innerText()).trim());
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await expect(like).toHaveText(String(n + 1));

  // abrir la publicación y comentar
  await bowl.getByRole('button', { name: /Comentarios/ }).click();
  await expect(page).toHaveURL(/\/comunidad\/\d+$/);
  await expect(page.getByRole('heading', { name: 'Comentarios' })).toBeVisible();
  const before = await page.locator('.cmt').count();
  expect(before).toBeGreaterThanOrEqual(2); // los de ejemplo
  await page.getByRole('textbox', { name: 'Comentario' }).fill('¡La hago el domingo!');
  await page.getByRole('textbox', { name: 'Comentario' }).press('Enter');
  await expect(page.locator('.cmt')).toHaveCount(before + 1);
  await expect(page.locator('.cmt').last()).toContainText('Lucía F.');
  await expect(page.locator('.cmt').last()).toContainText('¡La hago el domingo!');
  await page.reload();
  await expect(page.locator('.cmt')).toHaveCount(before + 1);
});

test('publicar con foto y borrar', async ({ page }) => {
  await page.goto('/comunidad');
  await page.getByRole('button', { name: /Compartir/ }).click();
  await expect(page).toHaveURL('/comunidad/compartir');
  await expect(page.getByRole('button', { name: 'Publicar' })).toBeDisabled();
  await expect(page.getByText('Se publica con tu objetivo: Moverme más.')).toBeVisible();
  await page.getByRole('button', { name: /Actividad/ }).click();
  await page.getByLabel('Título').fill('Hoy caminé 30 min por el parque');
  await page.getByLabel('Contá más').fill('Fui con mi perra y aprovechamos el sol.');
  await page.locator('#pfile').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.locator('.pprev img')).toBeVisible();
  await shot(page, 'compartir');
  const created = page.waitForResponse(r => r.url().endsWith('/api/posts') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Publicar' }).click();
  expect((await created).status()).toBe(201);
  await expect(page.locator('.toast')).toHaveText('¡Publicado en la comunidad!');

  // aparece primero, con la foto servida por el backend
  const mine = page.locator('article.post').first();
  await expect(mine).toContainText('Lucía F. (vos)');
  await expect(mine).toContainText('Hoy caminé 30 min por el parque');
  const img = mine.locator('img.pimg');
  await expect(img).toBeVisible();
  expect(await img.evaluate(el => el.complete && el.naturalWidth > 0)).toBeTruthy();

  // borrar
  await mine.getByRole('button', { name: /Comentarios/ }).click();
  await page.getByRole('button', { name: 'Borrar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Volver' }).click(); // arrepentirse no borra nada
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Borrar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, borrar' }).click();
  await expect(page.locator('.toast')).toHaveText('Publicación borrada');
  await expect(page).toHaveURL('/comunidad');
  await expect(page.locator('article.post').filter({ hasText: 'Hoy caminé 30 min por el parque' })).toHaveCount(0);
});
