import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3010';
const ADMIN_USER = process.env.ADMIN_USER || 'b3toh';
const ADMIN_PASS = process.env.ADMIN_PASS || 'elgeneral2018';

test.describe('Navegación a campañas pendientes desde dashboard admin', () => {
  test('El enlace lleva a la página de campañas pendientes', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('input[name="usuario"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/admin/dashboard.html`);
    // Click en el enlace de campañas pendientes
  await page.click('text=Revisar campañas pendientes');
    await page.waitForURL(`${BASE_URL}/habysupply/admin.html`);
    // Verifica que la página de campañas pendientes se muestra
    await expect(page.locator('h2')).toHaveText(/Campañas pendientes/i);
    await expect(page.locator('#admin-campanias-list')).toBeVisible();
  });
});
