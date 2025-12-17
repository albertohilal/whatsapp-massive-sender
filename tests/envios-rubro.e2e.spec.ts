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
      const txt = (rubroText || '').toLowerCase();
      // Aceptar variantes previstas: tatu / tattoo / tatoo
      expect(txt.includes('tatu') || txt.includes('tattoo') || txt.includes('tatoo')).toBeTruthy();
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
    
    // La mayoría (>=70%) debe tener rubro asignado para considerar la sincronización correcta
    const porcentaje = (prospectosConRubro / Math.min(rows, 20)) * 100;
    expect(porcentaje).toBeGreaterThan(70);
  });

  test('debe filtrar prospectos por área disponible', async ({ page }) => {
    await page.goto('http://localhost:3010/form_envios.html?sesion=haby&cliente_id=51&cliente_nombre=Haby');

    // Probar áreas conocidas y elegir la primera que tenga resultados
    const AREAS_VALIDAS = [
      'Tatuadores',
      'Restaurantes',
      'Bares',
      'Cafeterías',
      'Hoteles',
      'Gimnasios',
      'Peluquerías',
      'Estéticas',
      'Otro'
    ];
    let areaElegida = '';
    for (const area of AREAS_VALIDAS) {
      const resp = await page.request.get(`http://localhost:3010/api/envios/filtrar-prospectos?cliente_id=51&estado=sin_envio&area=${encodeURIComponent(area)}`);
      if (resp.ok()) {
        const data = await resp.json();
        const lista = Array.isArray(data?.prospectos) ? data.prospectos : [];
        if (lista.length > 0) {
          areaElegida = area;
          break;
        }
      }
    }

    // Si no hay ninguna área con resultados, omitir la prueba para evitar falsos negativos
    test.skip(areaElegida === '', 'No se encontró un área con resultados para este cliente.');

    // Usar el área encontrada en la UI (comparación case-insensitive en el frontend)
    await page.fill('#filtroRubro', areaElegida.toLowerCase());
    await page.click('button:has-text("Filtrar")');

    // Debe renderizar filas
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);

    // Con área activa, al menos el rubro no debe ser 'Sin rubro'
    for (let i = 0; i < Math.min(rows, 10); i++) {
      const rubroText = await page.locator(`table tbody tr:nth-child(${i + 1}) td:nth-child(4)`).textContent();
      expect((rubroText || '').trim().toLowerCase()).not.toBe('sin rubro');
    }
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
    // 1. Login para obtener cookie de sesión
    const loginResponse = await request.post('http://localhost:3010/api/login', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        usuario: 'b3toh',
        password: 'elgeneral2018'
      }
    });
    expect(loginResponse.status()).toBe(200);
    const cookies = loginResponse.headers()['set-cookie'];
    expect(cookies).toBeDefined();
    // 2. Usar cookie en la petición autenticada
    const url = 'http://localhost:3010/api/envios/filtrar-prospectos?cliente_id=51&wapp_valido=1';
    const response = await request.get(url, {
      headers: {
        cookie: Array.isArray(cookies) ? cookies.join('; ') : cookies
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
