// Script para actualizar ref_ext en llxbx_societe usando el valor de ll_lugares_haby.ref_ext
// Coincidencia por teléfono

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

  // Seleccionar coincidencias por teléfono
  const [rows] = await conn.query(`
    SELECT s.rowid AS societe_id, h.ref_ext
    FROM llxbx_societe s
    JOIN ll_lugares_haby h ON s.phone_mobile = h.telefono_wapp
    WHERE h.ref_ext IS NOT NULL AND h.ref_ext != ''
  `);

  let updated = 0;
  for (const row of rows) {
    await conn.query('UPDATE llxbx_societe SET ref_ext = ? WHERE rowid = ?', [row.ref_ext, row.societe_id]);
    updated++;
  }
  await conn.end();
  console.log(`Actualizados ${updated} registros en llxbx_societe con ref_ext de ll_lugares_haby.`);
}

main().catch(err => {
  console.error('Error actualizando ref_ext en llxbx_societe:', err);
  process.exit(1);
});
