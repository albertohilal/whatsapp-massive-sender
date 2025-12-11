// Script completo para agregar campo rubro_id a llxbx_societe
// Siguiendo el enfoque más simple y efectivo: columna directa

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

  console.log('\n=== PASO 1: VERIFICAR SI rubro_id YA EXISTE EN llxbx_societe ===');
  
  const [estructura] = await conn.query('DESCRIBE llxbx_societe');
  const tieneRubroId = estructura.some(col => col.Field === 'rubro_id');
  
  if (tieneRubroId) {
    console.log('✅ Campo rubro_id ya existe en llxbx_societe');
  } else {
    console.log('⚠️  Campo rubro_id NO existe. Necesita ejecutar:');
    console.log('   ALTER TABLE llxbx_societe ADD COLUMN rubro_id INT NULL;');
    console.log('   ALTER TABLE llxbx_societe ADD INDEX idx_rubro_id (rubro_id);');
    console.log('\n¿Desea ejecutar el ALTER TABLE ahora? (Esto modificará la base de datos)');
    
    // Para ejecución manual, no ejecutamos automáticamente
    await conn.end();
    console.log('\n⚠️  DETENIDO. Ejecute manualmente el ALTER TABLE si está seguro.');
    return;
  }

  console.log('\n=== PASO 2: SINCRONIZAR rubro_id DESDE ll_lugares ===');
  
  // Actualizar rubro_id para registros que vienen de ll_lugares
  const [resultLugares] = await conn.query(`
    UPDATE llxbx_societe s
    INNER JOIN ll_lugares l ON s.ref_ext = CONCAT('lugares_', l.id)
    SET s.rubro_id = l.rubro_id
    WHERE l.rubro_id IS NOT NULL
  `);
  console.log(`✅ Sincronizados ${resultLugares.affectedRows} registros desde ll_lugares`);

  console.log('\n=== PASO 3: SINCRONIZAR rubro_id DESDE ll_lugares_haby (si aplica) ===');
  
  // Verificar si ll_lugares_haby tiene campo rubro_id
  try {
    const [estructuraHaby] = await conn.query('DESCRIBE ll_lugares_haby');
    const habyTieneRubroId = estructuraHaby.some(col => col.Field === 'rubro_id');
    
    if (habyTieneRubroId) {
      const [resultHaby] = await conn.query(`
        UPDATE llxbx_societe s
        INNER JOIN ll_lugares_haby h ON s.ref_ext = CONCAT('haby_', h.id)
        SET s.rubro_id = h.rubro_id
        WHERE h.rubro_id IS NOT NULL
      `);
      console.log(`✅ Sincronizados ${resultHaby.affectedRows} registros desde ll_lugares_haby`);
    } else {
      console.log('⚠️  ll_lugares_haby no tiene campo rubro_id, se omite');
    }
  } catch (err) {
    console.log('⚠️  Error con ll_lugares_haby:', err.message);
  }

  console.log('\n=== PASO 4: VERIFICAR RESULTADOS ===');
  
  const [stats] = await conn.query(`
    SELECT 
      COUNT(*) AS total_societes,
      COUNT(rubro_id) AS con_rubro_id,
      COUNT(*) - COUNT(rubro_id) AS sin_rubro_id,
      COUNT(DISTINCT rubro_id) AS rubros_distintos
    FROM llxbx_societe
  `);
  console.table(stats);

  console.log('\n=== PASO 5: DISTRIBUCIÓN DE RUBROS ===');
  const [distribucion] = await conn.query(`
    SELECT 
      s.rubro_id,
      r.nombre AS rubro_nombre,
      COUNT(*) AS cantidad_societes
    FROM llxbx_societe s
    LEFT JOIN ll_rubros r ON s.rubro_id = r.id
    WHERE s.rubro_id IS NOT NULL
    GROUP BY s.rubro_id, r.nombre
    ORDER BY cantidad_societes DESC
    LIMIT 20
  `);
  console.table(distribucion);

  console.log('\n=== PASO 6: PROBAR CONSULTA CON RUBRO ===');
  const [muestra] = await conn.query(`
    SELECT 
      s.rowid AS id,
      s.nom AS nombre,
      s.phone_mobile AS telefono_wapp,
      s.rubro_id,
      r.nombre AS rubro_nombre
    FROM llxbx_societe s
    LEFT JOIN ll_rubros r ON s.rubro_id = r.id
    WHERE s.rubro_id IS NOT NULL
    LIMIT 10
  `);
  console.table(muestra);

  await conn.end();
  
  console.log('\n✅ SINCRONIZACIÓN COMPLETA');
  console.log('\n📝 PRÓXIMOS PASOS:');
  console.log('1. Actualizar consulta en routes/envios.js para incluir rubro con JOIN a ll_rubros');
  console.log('2. Actualizar frontend form_envios.html para mostrar rubro_nombre');
  console.log('3. Agregar sincronización de rubro_id al script recrear_ll_lugares_clientes.js');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
