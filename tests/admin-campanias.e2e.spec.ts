import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3010';
const ADMIN_USER = process.env.ADMIN_USER || 'b3toh';
const ADMIN_PASS = process.env.ADMIN_PASS || 'elgeneral2018';

test.describe('Campañas pendientes en dashboard admin', () => {
  test('Visualizar campañas pendientes', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.fill('input[name="usuario"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/admin/dashboard.html`);
    // Navega a la sección de campañas
    await page.click('text=Campañas');
    // Espera a que se cargue la lista de campañas
    await expect(page.locator('h2')).toContainText(['Campañas', 'Pendientes']);
    // Verifica que se muestran campañas con estado pendiente
    const campanias = await page.locator('.campania-item, .campania-row').allTextContents();
    expect(campanias.some(c => c.toLowerCase().includes('pendiente'))).toBeTruthy();
  });
});
