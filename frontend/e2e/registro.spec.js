import { expect, test } from '@playwright/test';
import { PASS } from './helpers.js';

// El alta completa por la interfaz: crear la cuenta, verificar el código, datos, preferencias, plan listo,
// y después salir y volver a entrar con la contraseña. Los demás tests crean el usuario por la API.
test('registro, verificación, datos, preferencias y volver a entrar', async ({ page }) => {
  const email = `e2e-alta-${Date.now()}@wopfit.test`;
  await page.goto('/');
  await page.getByRole('button', { name: /Crear cuenta/ }).click();
  await expect(page).toHaveURL('/registro');

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASS);
  await page.getByLabel('Repetí tu contraseña').fill(PASS);
  const crear = page.getByRole('button', { name: /Crear cuenta/ });
  await expect(crear).toBeDisabled(); // falta aceptar los términos
  await page.getByRole('button', { name: /Acepto los Términos/ }).click();
  await crear.click();

  // Verificar: el código de desarrollo se ve en pantalla (WOPFIT_DEV_CODES=true)
  await expect(page).toHaveURL('/verificar');
  const dev = await page.locator('.devcode').innerText();
  const code = dev.match(/\d{6}/)[0];
  const input = page.getByLabel('Código de 6 números');
  await input.fill(code === '000000' ? '111111' : '000000');
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page.locator('.toast, .formerr').first()).toContainText('El código no coincide');
  await input.fill(code);
  await page.getByRole('button', { name: 'Verificar' }).click();

  // Datos básicos
  await expect(page).toHaveURL('/sobre-vos');
  await page.getByLabel('¿Cómo te llamamos?').fill('Alta Prueba');
  await page.getByLabel('Fecha de nacimiento').fill('1998-05-20');
  await page.getByRole('button', { name: 'Continuar' }).click();

  // Preferencias en 3 pasos
  await expect(page).toHaveURL('/preferencias/1');
  const siguiente = page.getByRole('button', { name: /Siguiente/ });
  await expect(siguiente).toBeDisabled(); // sin objetivo no avanza
  await page.getByRole('button', { name: /Moverme más/ }).click();
  await siguiente.click();
  await expect(page).toHaveURL('/preferencias/2');
  await page.getByRole('button', { name: 'martes' }).click();
  await siguiente.click();
  await expect(page).toHaveURL('/preferencias/3');
  await page.getByRole('button', { name: /Generar mi plan/ }).click();

  await expect(page.getByRole('heading', { name: '¡Tu plan está listo!' })).toBeVisible();
  await expect(page.getByText('4 días / sem')).toBeVisible(); // lunes, martes, miércoles y viernes
  await page.getByRole('button', { name: 'Empezar mi plan' }).click();
  await expect(page).toHaveURL('/inicio');
  await expect(page.getByRole('heading', { name: 'Hola, Alta' })).toBeVisible();

  // Salir y volver a entrar con la contraseña
  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('/');
  await page.getByRole('button', { name: 'Ya tengo cuenta' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASS);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL('/inicio');
  await expect(page.getByRole('heading', { name: 'Hola, Alta' })).toBeVisible();
});
