// Script para ejecutar crear_ll_societe_extended.sql
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    multipleStatements: true
  });

  console.log('📄 Leyendo script SQL...');
  const sqlPath = path.join(__dirname, 'crear_ll_societe_extended.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Ejecutando script crear_ll_societe_extended.sql...');
  const [results] = await conn.query(sql);

  console.log('✅ Script ejecutado exitosamente');
  
  // Mostrar resultados
  if (Array.isArray(results)) {
    results.forEach((result, index) => {
      if (result && Array.isArray(result)) {
        console.log(`\n📊 Resultado ${index + 1}:`);
        console.table(result);
      }
    });
  }

  await conn.end();
  console.log('\n✅ Tabla ll_societe_extended creada y poblada exitosamente!');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
