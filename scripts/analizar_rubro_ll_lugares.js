// Script para analizar estructura y valores de ll_lugares enfocado en rubro
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

  console.log('\n=== 1. ESTRUCTURA DE ll_lugares ===');
  const [estructura] = await conn.query('DESCRIBE ll_lugares');
  console.table(estructura);

  console.log('\n=== 2. ANÁLISIS DE CAMPO rubro_id EN ll_lugares ===');
  const [analisis] = await conn.query(`
    SELECT 
      COUNT(*) AS total_registros,
      COUNT(rubro_id) AS con_rubro_id,
      COUNT(*) - COUNT(rubro_id) AS sin_rubro_id,
      COUNT(DISTINCT rubro_id) AS rubros_distintos
    FROM ll_lugares
  `);
  console.table(analisis);

  console.log('\n=== 3. MUESTRA DE REGISTROS CON rubro_id ===');
  const [muestra] = await conn.query(`
    SELECT id, nombre, rubro_id, telefono_wapp
    FROM ll_lugares 
    WHERE rubro_id IS NOT NULL
    LIMIT 10
  `);
  console.table(muestra);

  console.log('\n=== 4. DISTRIBUCIÓN POR rubro_id ===');
  const [distribucion] = await conn.query(`
    SELECT 
      rubro_id,
      COUNT(*) AS cantidad_lugares
    FROM ll_lugares
    WHERE rubro_id IS NOT NULL
    GROUP BY rubro_id
    ORDER BY cantidad_lugares DESC
    LIMIT 20
  `);
  console.table(distribucion);

  console.log('\n=== 5. TABLA ll_rubros ===');
  const [rubrosCount] = await conn.query(`
    SELECT COUNT(*) AS total_rubros
    FROM ll_rubros
  `);
  console.table(rubrosCount);

  console.log('\n=== 6. MUESTRA DE RUBROS DISPONIBLES ===');
  const [rubros] = await conn.query(`
    SELECT id, nombre
    FROM ll_rubros
    ORDER BY id
    LIMIT 20
  `);
  console.table(rubros);

  console.log('\n=== 7. JOIN ll_lugares + ll_rubros ===');
  const [joinResult] = await conn.query(`
    SELECT 
      l.id,
      l.nombre AS lugar_nombre,
      l.rubro_id,
      r.nombre AS rubro_nombre,
      l.telefono_wapp
    FROM ll_lugares l
    LEFT JOIN ll_rubros r ON l.rubro_id = r.id
    WHERE l.rubro_id IS NOT NULL
    LIMIT 10
  `);
  console.table(joinResult);

  console.log('\n=== 8. COMPARACIÓN CON llxbx_societe.fk_typent ===');
  const [dolibarr] = await conn.query(`
    SELECT 
      COUNT(*) AS total_llxbx_societe,
      COUNT(fk_typent) AS con_fk_typent,
      COUNT(*) - COUNT(fk_typent) AS sin_fk_typent,
      COUNT(DISTINCT fk_typent) AS tipos_distintos
    FROM llxbx_societe
  `);
  console.table(dolibarr);

  console.log('\n=== 9. VALORES DE fk_typent EN llxbx_societe ===');
  const [typentDistribution] = await conn.query(`
    SELECT 
      fk_typent,
      COUNT(*) AS cantidad
    FROM llxbx_societe
    WHERE fk_typent IS NOT NULL
    GROUP BY fk_typent
    ORDER BY cantidad DESC
    LIMIT 20
  `);
  console.table(typentDistribution);

  console.log('\n=== 10. TABLA c_typent DE DOLIBARR (si existe) ===');
  try {
    const [typentTable] = await conn.query(`
      SELECT id, code, libelle
      FROM llxbx_c_typent
      ORDER BY id
      LIMIT 20
    `);
    console.table(typentTable);
  } catch (err) {
    console.log('Tabla llxbx_c_typent no encontrada o error:', err.message);
  }

  await conn.end();
  console.log('\n✅ Análisis completo finalizado');
}

main().catch(err => {
  console.error('❌ Error en análisis:', err);
  process.exit(1);
});
