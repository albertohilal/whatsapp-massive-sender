// Script para actualizar el campo ref_ext en ll_lugares_haby
// Asigna 'haby_{haby_id}' a todos los registros

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

  // Solo actualizar los registros que están en la base actual
  const [rows] = await conn.query('SELECT id FROM ll_lugares_haby');
  let updated = 0;
  for (const row of rows) {
    const ref_ext = `haby_${row.id}`;
    await conn.query('UPDATE ll_lugares_haby SET ref_ext = ? WHERE id = ?', [ref_ext, row.id]);
    updated++;
  }
  await conn.end();
  console.log(`Actualizados ${updated} registros con ref_ext (haby_{id}).`);
}

main().catch(err => {
  console.error('Error actualizando ref_ext:', err);
  process.exit(1);
});
