import { expect } from '@playwright/test';

// Ayudas compartidas por los tests e2e: crear usuarios contra la API, entrar con su token y sacar capturas.
export const API = 'http://localhost:8080/api';
export const PASS = 'clave1234';

/**
 * Crea un usuario verificado con datos y preferencias. Por defecto le arma el plan.
 * `premium`: 'mensual' | 'semestral' | 'anual' para activarlo. Devuelve { token, email, call }.
 */
export async function newUser(request, { name = 'Prueba', goals = ['mover'], days = [0, 2, 4], budget = 'bajo', avoid = [], plan = true, premium } = {}) {
  let token;
  const email = `e2e-${name.split(' ')[0].toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@wopfit.test`;
  const call = async (method, path, data) => {
    const res = await request.fetch(API + path, { method, data, headers: token ? { Authorization: 'Bearer ' + token } : {} });
    expect(res.ok(), `${method} ${path} → ${res.status()}`).toBeTruthy();
    return res.json();
  };
  const { devCode } = await call('POST', '/auth/register', { email, password: PASS });
  ({ token } = await call('POST', '/auth/verify', { email, code: devCode }));
  await call('PUT', '/me/about', { name, birthDate: '1995-03-10', heightCm: 170, weightKg: 68 });
  await call('PUT', '/me/preferences', { goals, days, minutes: 30, budget, activities: [], avoid, otherAvoid: '', health: [], level: 'principiante', equipment: ['nada'] });
  if (plan) await call('POST', '/plan');
  if (premium) await call('POST', '/subscription', { period: premium });
  return { token, email, call };
}

/** La próxima carga de la página ya entra con ese usuario. */
export const loginAs = (page, token) => page.addInitScript(t => localStorage.setItem('wopfit-token', t), token);

/** Captura para revisar a ojo; nunca hace fallar el test. */
export const shot = (page, name) => page.screenshot({ path: `test-results/${name}.png`, timeout: 10000 }).catch(() => {});
