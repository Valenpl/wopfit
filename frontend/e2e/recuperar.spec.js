import { expect, test } from '@playwright/test';
import { newUser } from './helpers.js';

// "¿Olvidaste tu contraseña?": código por email (en desarrollo se ve en pantalla) y contraseña nueva.
test('recuperar la contraseña con el código y volver a entrar', async ({ page, request }) => {
  const { email } = await newUser(request, { name: 'Olvido' });
  const NEW = 'nueva5678';
  await page.goto('/ingresar');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
  await expect(page).toHaveURL('/recuperar');
  await expect(page.getByLabel('Email')).toHaveValue(email); // viene del login
  await page.getByRole('button', { name: 'Mandarme el código' }).click();

  await expect(page.getByText(`Si ${email} tiene una cuenta, te mandamos un código de 6 números.`)).toBeVisible();
  const first = (await page.locator('.devcode').innerText()).match(/\d{6}/)[0];
  const change = page.getByRole('button', { name: 'Cambiar contraseña' });
  await page.getByLabel('Contraseña nueva').fill(NEW);
  await page.getByLabel('Repetí tu contraseña').fill(NEW);
  await expect(change).toBeDisabled(); // falta el código
  // Un código equivocado se invalida: hay que pedir otro.
  await page.getByLabel('Código de 6 números').fill(first === '000000' ? '111111' : '000000');
  await change.click();
  await expect(page.locator('.formerr')).toHaveText('El código no coincide. Pedí uno nuevo.');
  await page.getByRole('button', { name: 'Mandar otro código' }).click();
  await expect(page.locator('.devcode')).not.toContainText(first);
  const code = (await page.locator('.devcode').innerText()).match(/\d{6}/)[0];
  await page.getByLabel('Código de 6 números').fill(code);
  await change.click();

  await expect(page).toHaveURL('/inicio');
  await expect(page.locator('.toast')).toHaveText('Listo, ya podés usar tu contraseña nueva');
  await expect(page.getByRole('heading', { name: 'Hola, Olvido' })).toBeVisible();

  // Sale y entra con la contraseña nueva.
  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.getByRole('button', { name: 'Ya tengo cuenta' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(NEW);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL('/inicio');
});
