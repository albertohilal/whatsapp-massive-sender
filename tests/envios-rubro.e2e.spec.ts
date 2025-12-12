import { test, expect } from '@playwright/test';

test.describe('Filtro de Prospectos con Rubro', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3010/login.html');
    await page.fill('input[name="usuario"]', 'Haby');
    await page.fill('input[name="password"]', 'haby1973');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/haby/dashboard.html');
  });

  test('debe mostrar columna Rubro en la tabla de prospectos', async ({ page }) => {
    await page.goto('http://localhost:3010/form_envios.html?sesion=haby&cliente_id=51&cliente_nombre=Haby');
    
    // Hacer clic en Filtrar
    await page.click('button:has-text("Filtrar")');
    
    // Esperar que cargue la tabla
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Verificar que existe la columna Rubro en el header
    const rubroHeader = await page.locator('th:has-text("Rubro")');
    await expect(rubroHeader).toBeVisible();
    
    // Verificar que hay datos en la columna Rubro
    const primerRubro = await page.locator('table tbody tr:first-child td:nth-child(5)').textContent();
    expect(primerRubro).not.toBe('');
    expect(primerRubro).not.toBe('Sin rubro');
  });

  test('debe filtrar prospectos por rubro Tatuadores', async ({ page }) => {
    await page.goto('http://localhost:3010/form_envios.html?sesion=haby&cliente_id=51&cliente_nombre=Haby');

    // Filtrar por rubro con texto "tattoo" usando el id actualizado
    await page.fill('#filtroRubro', 'tattoo');
    await page.click('button:has-text("Filtrar")');

    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Verificar que todos los resultados contienen "tatua" en el rubro
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(rows, 10); i++) {
      const rubroText = await page.locator(`table tbody tr:nth-child(${i + 1}) td:nth-child(4)`).textContent();
      expect(rubroText?.toLowerCase()).toContain('tatua');
    }
  });

  test('debe cargar prospectos sin error 500', async ({ page }) => {
    // Interceptar la request al API
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/envios/filtrar-prospectos') && 
      response.status() === 200
    );
    
    await page.goto('http://localhost:3010/form_envios.html?sesion=haby&cliente_id=51&cliente_nombre=Haby');
    await page.click('button:has-text("Filtrar")');
    
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.prospectos).toBeDefined();
    expect(Array.isArray(data.prospectos)).toBeTruthy();
  });

  test('debe verificar que ll_societe_extended tiene datos sincronizados', async ({ page }) => {
    // Este test verifica indirectamente que la tabla existe y tiene datos
    await page.goto('http://localhost:3010/form_envios.html?sesion=haby&cliente_id=51&cliente_nombre=Haby');
    
    await page.click('button:has-text("Filtrar")');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Contar cuántos prospectos tienen rubro asignado
    const rows = await page.locator('table tbody tr').count();
    let prospectosConRubro = 0;
    
    for (let i = 0; i < Math.min(rows, 20); i++) {
      const rubroText = await page.locator(`table tbody tr:nth-child(${i + 1}) td:nth-child(5)`).textContent();
      if (rubroText && rubroText !== 'Sin rubro' && rubroText.trim() !== '') {
        prospectosConRubro++;
      }
    }
    
    // Al menos el 80% debe tener rubro asignado
    const porcentaje = (prospectosConRubro / Math.min(rows, 20)) * 100;
    expect(porcentaje).toBeGreaterThan(80);
  });

  test('no debe hacer JOIN a tablas origen (verificar performance)', async ({ page }) => {
    await page.goto('http://localhost:3010/form_envios.html?sesion=haby&cliente_id=51&cliente_nombre=Haby');
    
    const startTime = Date.now();
    await page.click('button:has-text("Filtrar")');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    // La consulta debe ser rápida (< 2 segundos)
    expect(responseTime).toBeLessThan(2000);
  });
});

test.describe('Sincronización de ll_societe_extended', () => {
  test('debe verificar estructura de tabla mediante API', async ({ request }) => {
    // Este test asume que tienes un endpoint de health/status
    // Si no existe, puedes crear uno simple o usar el endpoint de filtrar
    
    const response = await request.post('http://localhost:3010/api/envios/filtrar-prospectos', {
      data: {
        cliente_id: 51,
        solo_wapp_validos: true
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    // Verificar que la respuesta incluye el campo rubro
    if (data.prospectos && data.prospectos.length > 0) {
      expect(data.prospectos[0]).toHaveProperty('rubro');
    }
  });
});
