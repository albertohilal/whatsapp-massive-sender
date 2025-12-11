// Script para agregar campo rubro_id a llxbx_societe
// Opción 1: Usar extrafields (recomendado por Dolibarr)
// Opción 2: Agregar columna directa a llxbx_societe

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

  console.log('\n=== VERIFICANDO TABLA llxbx_societe_extrafields ===');
  
  try {
    const [tables] = await conn.query(`
      SHOW TABLES LIKE 'llxbx_societe_extrafields'
    `);
    
    if (tables.length > 0) {
      console.log('✅ Tabla llxbx_societe_extrafields existe');
      
      // Ver estructura
      const [estructura] = await conn.query('DESCRIBE llxbx_societe_extrafields');
      console.table(estructura);
      
      // Ver si ya existe campo rubro_id
      const tieneRubroId = estructura.some(col => col.Field === 'rubro_id');
      
      if (tieneRubroId) {
        console.log('✅ Campo rubro_id ya existe en extrafields');
      } else {
        console.log('⚠️  Campo rubro_id NO existe en extrafields');
        console.log('\n📝 Para agregar rubro_id a extrafields:');
        console.log('ALTER TABLE llxbx_societe_extrafields ADD COLUMN rubro_id INT NULL;');
      }
      
      // Ver datos actuales
      const [count] = await conn.query('SELECT COUNT(*) as total FROM llxbx_societe_extrafields');
      console.log(`\n📊 Registros en extrafields: ${count[0].total}`);
      
    } else {
      console.log('❌ Tabla llxbx_societe_extrafields NO existe');
      console.log('\n📝 OPCIÓN 1: Crear tabla extrafields (siguiendo estándar Dolibarr)');
      console.log(`
CREATE TABLE llxbx_societe_extrafields (
  rowid INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  fk_object INT(11) NOT NULL,
  rubro_id INT(11) NULL,
  import_key VARCHAR(14) NULL,
  UNIQUE KEY uk_societe_extrafields (fk_object),
  KEY idx_societe_extrafields_rubro (rubro_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      
      console.log('\n📝 OPCIÓN 2: Agregar columna directa a llxbx_societe (más simple)');
      console.log('ALTER TABLE llxbx_societe ADD COLUMN rubro_id INT NULL;');
      console.log('ALTER TABLE llxbx_societe ADD INDEX idx_rubro_id (rubro_id);');
    }
  } catch (err) {
    console.error('Error:', err);
  }

  console.log('\n=== RECOMENDACIÓN ===');
  console.log('OPCIÓN RECOMENDADA: Agregar columna directa a llxbx_societe');
  console.log('Razones:');
  console.log('  1. Más simple de consultar (no requiere JOIN a extrafields)');
  console.log('  2. Mejor rendimiento en queries');
  console.log('  3. ref_ext ya demuestra que Dolibarr permite columnas custom');
  console.log('  4. price_level está 100% vacío pero existe en tabla principal');
  console.log('\n¿Ejecutar ALTER TABLE para agregar rubro_id? (requiere confirmación)');

  await conn.end();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
