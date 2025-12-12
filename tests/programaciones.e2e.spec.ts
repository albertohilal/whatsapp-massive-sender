import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3010';
const ADMIN_USER = process.env.ADMIN_USER || 'b3toh';
const ADMIN_PASS = process.env.ADMIN_PASS || 'elgeneral2018';
const CLIENTE_ID = process.env.CLIENTE_HABY_ID || '51';

test.describe('Programaciones de campañas', () => {
  test('Crear programación como admin para un cliente', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('input[name="usuario"]', ADMIN_USER);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/admin/dashboard.html`);

    const nombreCampania = `Campania QA ${Date.now()}`;
    const campaniaId = await page.evaluate(async ({ nombreCampania, clienteId }) => {
      await fetch('/api/campanias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreCampania,
          mensaje: 'Mensaje test automático',
          estado: 'pendiente',
          cliente_id: Number(clienteId)
        })
      });
      const res = await fetch(`/api/campanias?cliente_id=${clienteId}`);
      const data = await res.json();
      const creada = data.find((c) => c.nombre === nombreCampania);
      return creada?.id || null;
    }, { nombreCampania, clienteId: CLIENTE_ID });

    expect(campaniaId, 'Campaña de prueba debe crearse').not.toBeNull();

    const comment = `Test auto ${Date.now()}`;
    const fechaHoy = new Date().toISOString().split('T')[0];
    const creada = await page.evaluate(async ({ campaniaId, clienteId, comment, fechaHoy }) => {
      const res = await fetch('/api/programaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campania_id: campaniaId,
          cliente_id: Number(clienteId),
          dias_semana: ['mon'],
          hora_inicio: '09:00',
          hora_fin: '10:00',
          cupo_diario: 1,
          fecha_inicio: fechaHoy,
          comentario: comment
        })
      });
      return res.ok;
    }, { campaniaId, clienteId: CLIENTE_ID, comment, fechaHoy });

    expect(creada, 'La programación debe crearse').toBeTruthy();

    const params = `modo=admin&cliente_id=${CLIENTE_ID}`;
    await page.goto(`${BASE_URL}/programaciones.html?${params}`);
    await expect(page.locator('h1')).toHaveText(/Programación de Campañas/i);
    const lista = page.locator('#lista-programaciones');
    await expect(lista).toContainText(nombreCampania, { timeout: 10000 });
  });
});
