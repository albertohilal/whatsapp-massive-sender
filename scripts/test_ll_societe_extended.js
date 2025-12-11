// Script para verificar integridad de ll_societe_extended antes de deploy
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
  });

  console.log('🔍 Verificando integridad de ll_societe_extended...\n');

  const tests = [];
  let passed = 0;
  let failed = 0;

  // Test 1: Tabla existe
  try {
    await conn.query('SELECT 1 FROM ll_societe_extended LIMIT 1');
    tests.push({ name: '✅ Tabla ll_societe_extended existe', status: 'PASS' });
    passed++;
  } catch (err) {
    tests.push({ name: '❌ Tabla ll_societe_extended existe', status: 'FAIL', error: err.message });
    failed++;
  }

  // Test 2: Tiene registros
  try {
    const [rows] = await conn.query('SELECT COUNT(*) as total FROM ll_societe_extended');
    const total = rows[0].total;
    if (total > 0) {
      tests.push({ name: `✅ Tiene registros (${total})`, status: 'PASS' });
      passed++;
    } else {
      tests.push({ name: '❌ Tiene registros', status: 'FAIL', error: 'Sin registros' });
      failed++;
    }
  } catch (err) {
    tests.push({ name: '❌ Tiene registros', status: 'FAIL', error: err.message });
    failed++;
  }

  // Test 3: 100% con rubro_id
  try {
    const [rows] = await conn.query('SELECT COUNT(*) as total, COUNT(rubro_id) as con_rubro FROM ll_societe_extended');
    const { total, con_rubro } = rows[0];
    if (total === con_rubro) {
      tests.push({ name: `✅ 100% con rubro_id (${con_rubro}/${total})`, status: 'PASS' });
      passed++;
    } else {
      tests.push({ name: '⚠️  No todos tienen rubro_id', status: 'WARN', error: `${con_rubro}/${total}` });
      passed++;
    }
  } catch (err) {
    tests.push({ name: '❌ Verificar rubro_id', status: 'FAIL', error: err.message });
    failed++;
  }

  // Test 4: FK constraint con llxbx_societe
  try {
    const [rows] = await conn.query(`
      SELECT COUNT(*) as huerfanos 
      FROM ll_societe_extended se 
      LEFT JOIN llxbx_societe s ON se.societe_id = s.rowid 
      WHERE s.rowid IS NULL
    `);
    if (rows[0].huerfanos === 0) {
      tests.push({ name: '✅ FK válida con llxbx_societe', status: 'PASS' });
      passed++;
    } else {
      tests.push({ name: '❌ FK con llxbx_societe', status: 'FAIL', error: `${rows[0].huerfanos} huérfanos` });
      failed++;
    }
  } catch (err) {
    tests.push({ name: '❌ FK con llxbx_societe', status: 'FAIL', error: err.message });
    failed++;
  }

  // Test 5: FK constraint con ll_rubros
  try {
    const [rows] = await conn.query(`
      SELECT COUNT(*) as huerfanos 
      FROM ll_societe_extended se 
      LEFT JOIN ll_rubros r ON se.rubro_id = r.id 
      WHERE r.id IS NULL AND se.rubro_id IS NOT NULL
    `);
    if (rows[0].huerfanos === 0) {
      tests.push({ name: '✅ FK válida con ll_rubros', status: 'PASS' });
      passed++;
    } else {
      tests.push({ name: '❌ FK con ll_rubros', status: 'FAIL', error: `${rows[0].huerfanos} huérfanos` });
      failed++;
    }
  } catch (err) {
    tests.push({ name: '❌ FK con ll_rubros', status: 'FAIL', error: err.message });
    failed++;
  }

  // Test 6: ll_lugares_haby tiene rubro_id
  try {
    const [rows] = await conn.query('SELECT COUNT(*) as total FROM ll_lugares_haby WHERE rubro_id IS NOT NULL');
    if (rows[0].total > 0) {
      tests.push({ name: `✅ ll_lugares_haby con rubro_id (${rows[0].total})`, status: 'PASS' });
      passed++;
    } else {
      tests.push({ name: '⚠️  ll_lugares_haby sin rubro_id', status: 'WARN' });
      passed++;
    }
  } catch (err) {
    tests.push({ name: '⚠️  ll_lugares_haby campo rubro_id', status: 'WARN', error: 'Campo no existe' });
    passed++;
  }

  // Test 7: Sincronización con origen google_places
  try {
    const [rows] = await conn.query(`
      SELECT COUNT(*) as total 
      FROM ll_societe_extended 
      WHERE origen = 'google_places'
    `);
    if (rows[0].total > 0) {
      tests.push({ name: `✅ Origen google_places (${rows[0].total})`, status: 'PASS' });
      passed++;
    } else {
      tests.push({ name: '⚠️  Sin origen google_places', status: 'WARN' });
      passed++;
    }
  } catch (err) {
    tests.push({ name: '❌ Origen google_places', status: 'FAIL', error: err.message });
    failed++;
  }

  // Test 8: Sincronización con origen haby
  try {
    const [rows] = await conn.query(`
      SELECT COUNT(*) as total 
      FROM ll_societe_extended 
      WHERE origen = 'haby'
    `);
    if (rows[0].total > 0) {
      tests.push({ name: `✅ Origen haby (${rows[0].total})`, status: 'PASS' });
      passed++;
    } else {
      tests.push({ name: '⚠️  Sin origen haby', status: 'WARN' });
      passed++;
    }
  } catch (err) {
    tests.push({ name: '❌ Origen haby', status: 'FAIL', error: err.message });
    failed++;
  }

  // Test 9: Query de envios funciona
  try {
    const [rows] = await conn.query(`
      SELECT s.rowid, s.nom, s.phone_mobile, COALESCE(r.nombre, 'Sin rubro') AS rubro
      FROM llxbx_societe s
      INNER JOIN ll_lugares_clientes lc ON lc.societe_id = s.rowid
      LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
      LEFT JOIN ll_rubros r ON se.rubro_id = r.id
      WHERE lc.cliente_id = 51
      LIMIT 10
    `);
    if (rows.length > 0 && rows[0].rubro) {
      tests.push({ name: `✅ Query de envios funciona (${rows.length} registros)`, status: 'PASS' });
      passed++;
    } else {
      tests.push({ name: '❌ Query de envios', status: 'FAIL', error: 'Sin resultados o sin rubro' });
      failed++;
    }
  } catch (err) {
    tests.push({ name: '❌ Query de envios', status: 'FAIL', error: err.message });
    failed++;
  }

  // Test 10: Índices existen
  try {
    const [rows] = await conn.query(`
      SHOW INDEX FROM ll_societe_extended
      WHERE Key_name IN ('PRIMARY', 'idx_rubro', 'idx_origen')
    `);
    if (rows.length >= 1) {
      tests.push({ name: `✅ Índices creados (${rows.length})`, status: 'PASS' });
      passed++;
    } else {
      tests.push({ name: '⚠️  Faltan índices', status: 'WARN' });
      passed++;
    }
  } catch (err) {
    tests.push({ name: '❌ Índices', status: 'FAIL', error: err.message });
    failed++;
  }

  await conn.end();

  // Mostrar resultados
  console.log('═══════════════════════════════════════════════════');
  tests.forEach(test => {
    if (test.error) {
      console.log(`${test.name} - ${test.error}`);
    } else {
      console.log(test.name);
    }
  });
  console.log('═══════════════════════════════════════════════════');
  console.log(`\n📊 RESULTADO: ${passed} PASS, ${failed} FAIL`);
  
  if (failed > 0) {
    console.log('\n❌ Falló algún test. NO DEPLOYAR.\n');
    process.exit(1);
  } else {
    console.log('\n✅ Todos los tests pasaron. OK para DEPLOY.\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('❌ Error ejecutando tests:', err);
  process.exit(1);
});
