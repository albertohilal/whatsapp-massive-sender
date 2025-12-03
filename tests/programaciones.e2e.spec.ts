import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3010';
const ADMIN_USER = process.env.ADMIN_USER || 'b3toh';
const ADMIN_PASS = process.env.ADMIN_PASS || 'elgeneral2018';
const CLIENTE_ID = process.env.CLIENTE_HABY_ID || '51';

test.describe('Programaciones de campañas', () => {
  test('Crear programación como admin para un cliente', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.fill('input[name="usuario"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/admin/dashboard.html`);

    const params = `modo=admin&cliente_id=${CLIENTE_ID}`;
    await page.goto(`${BASE_URL}/programaciones.html?${params}`);
    await expect(page.locator('h1')).toHaveText(/Programación de Campañas/i);

    const select = page.locator('#campania-id');
    await select.waitFor({ state: 'attached' });
    const options = await select.locator('option').count();
    expect(options).toBeGreaterThan(0);

    await page.check('input[type="checkbox"][value="mon"]');
    await page.fill('#hora-inicio', '10:00');
    await page.fill('#hora-fin', '11:00');
    await page.fill('#cupo-diario', '5');
    const today = new Date().toISOString().split('T')[0];
    await page.fill('#fecha-inicio', today);
    const comment = `Test auto ${Date.now()}`;
    await page.fill('#comentario', comment);

    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button[type="submit"]');

    const lista = page.locator('#lista-programaciones');
    await expect(lista).toContainText(comment, { timeout: 10000 });
  });
});
