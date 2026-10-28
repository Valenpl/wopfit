import { expect, test } from '@playwright/test';
import { loginAs, newUser, shot } from './helpers.js';

// Preguntale a Wopi: 3 consultas gratis y 20 con Premium por mes; los botones de las respuestas llevan a la app.
const users = {};
const EVERY_DAY = { days: [0, 1, 2, 3, 4, 5, 6], goals: ['mover', 'comer'], budget: 'medio', avoid: ['lacteos'] }; // siempre hay rutina hoy

test.beforeAll(async ({ request }) => {
  users.free = (await newUser(request, { name: 'Wopi', ...EVERY_DAY })).token;
  users.prem = (await newUser(request, { name: 'WopiPrem', ...EVERY_DAY, premium: 'anual' })).token;
});

const replies = page => page.locator('.chat .bub.w');

test('Gratuito: 3 consultas, respuestas con acciones y después invita a Premium', async ({ page }) => {
  await loginAs(page, users.free);
  await page.goto('/wopi');
  await expect(page.getByText('Gratis · 3 de 3 este mes')).toBeVisible();
  await expect(replies(page).first()).toContainText('¡Hola, Wopi!');
  await expect(page.locator('.chips .chip')).toHaveCount(5);

  // 1) sugerencia de comida: ideas sin lácteos, con botón para sumarla a hoy
  await page.getByRole('button', { name: '¿Qué almuerzo con $2.000?' }).click();
  await expect(page.locator('.chat .bub.u')).toHaveText(['¿Qué almuerzo con $2.000?']);
  await expect(replies(page).nth(1)).toContainText('Te propongo estas ideas de almuerzo (sin lácteos)');
  await expect(page.getByText('Gratis · 2 de 3 este mes')).toBeVisible();
  const add = page.locator('.opt2').first().getByRole('button', { name: 'Agregar a mi almuerzo de hoy' });
  const accepted = page.waitForResponse(r => r.url().includes('/accept') && r.request().method() === 'POST');
  await add.click();
  expect((await accepted).ok()).toBeTruthy();
  await expect(page.locator('.toast')).toHaveText('Agregado a tu almuerzo de hoy 🍽️');

  // 2) "otras opciones" sigue con el mismo tema (el botón aparece solo si hay más de 2 ideas; escribirlo anda siempre)
  await page.getByLabel('Mensaje').fill('Dame otras opciones');
  await page.getByLabel('Mensaje').press('Enter');
  await expect(replies(page).nth(2)).toContainText('almuerzo');

  // 3) escribiendo: poco tiempo → versión corta para hoy
  await page.getByLabel('Mensaje').fill('Tengo 10 minutos, ¿qué hago?');
  await page.getByLabel('Mensaje').press('Enter');
  await expect(replies(page).nth(3)).toContainText('¡Con poco tiempo también suma! Te propongo:');
  await expect(replies(page).nth(3).locator('b')).toHaveCount(1); // la **negrita** se ve como negrita
  await shot(page, 'wopi-gratis');

  // sin cupo
  await expect(page.getByText('Gratis · 0 de 3 este mes')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Seguí charlando con Wopi en Premium' })).toBeVisible();
  await expect(page.getByLabel('Mensaje')).toBeDisabled();
  await expect(page.getByRole('button', { name: /Dame otras opciones/ })).toHaveCount(0);

  // la conversación queda guardada
  await page.reload();
  await expect(page.locator('.chat .bub')).toHaveCount(7);

  // "Hacer esto hoy" usa la versión corta en lugar de la rutina de hoy
  await replies(page).nth(3).getByRole('button', { name: 'Hacer esto hoy' }).click();
  await expect(page).toHaveURL(/\/entreno\/\d+$/);
  await expect(page.locator('.toast')).toContainText('Hoy hacés la versión corta');

  await page.goto('/perfil');
  await expect(page.locator('.listrow').filter({ hasText: 'Preguntale a Wopi' })).toContainText('0 consultas disponibles este mes');
});

test('Premium: 20 por mes y los botones llevan a profesionales y a la lista del súper', async ({ page }) => {
  await loginAs(page, users.prem);
  await page.goto('/wopi');
  await expect(page.getByText('★ Premium · 20 de 20 este mes')).toBeVisible();

  await page.getByLabel('Mensaje').fill('Me duele la rodilla');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(replies(page).nth(1)).toContainText('consultá con un profesional');
  await page.getByRole('button', { name: 'Consultar a un entrenador' }).click();
  await expect(page).toHaveURL('/profesionales?tipo=entre');
  await expect(page.locator('.seg button.on')).toHaveText('Entrenadores');

  await page.goto('/wopi');
  await page.getByLabel('Mensaje').fill('Armame la lista del súper');
  await page.getByLabel('Mensaje').press('Enter');
  await expect(replies(page).nth(2)).toContainText('Para esta semana necesitás principalmente:');
  await expect(page.getByText('★ Premium · 18 de 20 este mes')).toBeVisible();
  await shot(page, 'wopi-premium');
  await page.getByRole('button', { name: 'Ver la lista del súper' }).click();
  await expect(page).toHaveURL('/comida?tab=super');
  await expect(page.getByRole('heading', { name: 'Tu lista del súper' })).toBeVisible();
});
