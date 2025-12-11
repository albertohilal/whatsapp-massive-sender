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

  console.log('\n=== ESTRUCTURA DE llxbx_societe (campos relevantes) ===');
  const [estructura] = await conn.query('DESCRIBE llxbx_societe');
  
  // Filtrar solo campos FK o que podrían usarse
  const camposRelevantes = estructura.filter(row => 
    row.Field.includes('fk_') || 
    ['price_level', 'barcode', 'note_private', 'note_public'].includes(row.Field)
  );
  console.table(camposRelevantes);

  console.log('\n=== ANÁLISIS DE CAMPOS POTENCIALES PARA VINCULAR CON ll_rubros ===');
  
  const campos = [
    'fk_forme_juridique',
    'fk_effectif',
    'fk_typent',
    'fk_prospectlevel',
    'fk_stcomm',
    'price_level'
  ];

  for (const campo of campos) {
    try {
      const [stats] = await conn.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(${campo}) AS con_valor,
          COUNT(*) - COUNT(${campo}) AS sin_valor,
          COUNT(DISTINCT ${campo}) AS valores_distintos
        FROM llxbx_societe
      `);
      console.log(`\n${campo}:`);
      console.table(stats);
      
      // Si tiene valores, mostrar distribución
      if (stats[0].con_valor > 0) {
        const [distribucion] = await conn.query(`
          SELECT ${campo}, COUNT(*) as cantidad
          FROM llxbx_societe
          WHERE ${campo} IS NOT NULL
          GROUP BY ${campo}
          ORDER BY cantidad DESC
          LIMIT 10
        `);
        console.log(`  Distribución de valores:`);
        console.table(distribucion);
      }
    } catch (err) {
      console.log(`  ❌ Error con campo ${campo}: ${err.message}`);
    }
  }

  console.log('\n=== RECOMENDACIÓN ===');
  console.log('Basado en el análisis, las mejores opciones son:');
  console.log('');
  console.log('OPCIÓN 1 (RECOMENDADA): Agregar campo nuevo rubro_id a llxbx_societe');
  console.log('  - ALTER TABLE llxbx_societe ADD COLUMN rubro_id INT NULL;');
  console.log('  - Sincronizar desde ll_lugares.rubro_id usando ref_ext');
  console.log('  - Ventajas: Limpio, específico, no interfiere con Dolibarr');
  console.log('');
  console.log('OPCIÓN 2: Reutilizar campo existente poco usado (ej: fk_forme_juridique o price_level)');
  console.log('  - Solo si el campo tiene muy pocos valores o está vacío');
  console.log('  - Riesgo: Puede confundir o interferir con funcionalidad de Dolibarr');

  await conn.end();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
