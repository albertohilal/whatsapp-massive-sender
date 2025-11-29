import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3010';
const ADMIN_USER = process.env.ADMIN_USER || 'b3toh';
const ADMIN_PASS = process.env.ADMIN_PASS || 'elgeneral2018';

test.describe('Dashboard Administrador', () => {
  test('Login y acceso al dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(page.locator('text=Iniciar sesión')).toBeVisible();
    await page.fill('input[name="usuario"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/admin/dashboard.html`);
  await expect(page.locator('h1')).toHaveText(/Panel Administrador/i);
  // Verifica botones clave del dashboard
  await expect(page.locator('#btn-campanias')).toBeVisible();
  await expect(page.locator('#btn-prospectos')).toBeVisible();
  await expect(page.locator('#btn-envios')).toBeVisible();
  });
});
