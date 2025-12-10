// Script para importar leads faltantes de ll_lugares_haby a llxbx_societe
// Solo importa los que no existen en llxbx_societe (por telefono)

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

  // Seleccionar leads de Haby que no están en Societe
  const [rows] = await conn.query(`
    SELECT h.telefono_wapp, h.nombre, h.ref_ext
    FROM ll_lugares_haby h
    LEFT JOIN llxbx_societe s ON h.telefono_wapp = s.phone_mobile
    WHERE s.rowid IS NULL AND h.telefono_wapp IS NOT NULL AND h.telefono_wapp != ''
  `);

  let inserted = 0;
  for (const row of rows) {
    await conn.query(
      'INSERT INTO llxbx_societe (phone_mobile, nom, ref_ext) VALUES (?, ?, ?)',
      [row.telefono_wapp, row.nombre, row.ref_ext]
    );
    inserted++;
  }
  await conn.end();
  console.log(`Importados ${inserted} leads nuevos de Haby a llxbx_societe.`);
}

main().catch(err => {
  console.error('Error importando leads de Haby:', err);
  process.exit(1);
});
