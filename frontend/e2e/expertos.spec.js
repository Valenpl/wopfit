import { expect, test } from '@playwright/test';
import { loginAs, newUser, shot } from './helpers.js';

// Consejos de expertos: en la rutina según la salud de la persona y en las respuestas de Wopi, siempre con la fuente.
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]; // siempre hay rutina hoy

test('la rutina de una persona embarazada no tiene ejercicios boca arriba y explica por qué', async ({ page, request }) => {
  const { token } = await newUser(request, { name: 'Emba', days: EVERY_DAY, health: ['embarazo'] });
  await loginAs(page, token);
  await page.goto('/entreno');
  await page.getByRole('button', { name: /Comenzar rutina/ }).click();
  await expect(page).toHaveURL(/\/entreno\/\d+$/);
  await expect(page.getByText('Patada de glúteo en cuatro apoyos')).toBeAttached();
  await expect(page.getByText('Puente de glúteos', { exact: true })).toHaveCount(0);
  const tips = page.locator('.card').filter({ hasText: 'Lo que recomiendan los expertos' });
  await expect(tips.locator('.tip')).toHaveCount(2);
  await expect(tips.locator('.tip').first()).toContainText('después del primer trimestre, los ejercicios boca arriba');
  await expect(tips.getByRole('link').first()).toHaveAttribute('href', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/');
  await shot(page, 'rutina-expertos');
});

test('Wopi responde con consejos de expertos y muestra la fuente', async ({ page, request }) => {
  const { token } = await newUser(request, { name: 'Experta', avoid: ['tacc'] });
  await loginAs(page, token);
  await page.goto('/wopi');
  await page.getByLabel('Mensaje').fill('¿Cuánta agua tengo que tomar?');
  await page.getByLabel('Mensaje').press('Enter');
  const reply = page.locator('.chat .bub.w').nth(1);
  await expect(reply).toContainText('8 vasos de agua por día');
  await expect(reply.locator('b')).toHaveText('8 vasos de agua por día');
  await expect(reply.getByRole('link', { name: 'Ministerio de Salud, Guías Alimentarias para la Población Argentina (2015)' })).toHaveAttribute('target', '_blank');
  await page.getByLabel('Mensaje').fill('¿La avena tiene gluten?');
  await page.getByLabel('Mensaje').press('Enter');
  await expect(page.locator('.chat .bub.w').nth(2)).toContainText('trigo, avena, cebada y centeno');
  await shot(page, 'wopi-expertos');
  await page.locator('.chat .bub.w').nth(1).getByRole('button', { name: 'Poner una meta de agua' }).click();
  await expect(page).toHaveURL('/metas/nueva');
});
