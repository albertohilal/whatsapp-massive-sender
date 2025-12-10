// Script Node.js para diagnóstico final de sincronización de tablas
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

  const diagnostics = [
    {
      name: 'Leads scraping sin ref_ext en llxbx_societe',
      sql: `SELECT l.id, l.nombre, l.telefono_wapp FROM ll_lugares l LEFT JOIN llxbx_societe s ON s.ref_ext = CONCAT('lugares_', l.id) WHERE l.telefono_wapp IS NOT NULL AND l.telefono_wapp != '' AND s.rowid IS NULL LIMIT 20;`
    },
    {
      name: 'Leads Haby sin ref_ext en llxbx_societe',
      sql: `SELECT h.id, h.nombre, h.telefono_wapp FROM ll_lugares_haby h LEFT JOIN llxbx_societe s ON s.ref_ext = CONCAT('haby_', h.id) WHERE h.telefono_wapp IS NOT NULL AND h.telefono_wapp != '' AND s.rowid IS NULL LIMIT 20;`
    },
    {
      name: 'ref_ext en ll_lugares_clientes que no existen en llxbx_societe',
      sql: `SELECT lc.ref_ext, COUNT(*) AS cantidad FROM ll_lugares_clientes lc LEFT JOIN llxbx_societe s ON s.ref_ext = lc.ref_ext WHERE s.rowid IS NULL GROUP BY lc.ref_ext LIMIT 20;`
    },
    {
      name: 'Duplicados de ref_ext en llxbx_societe',
      sql: `SELECT ref_ext, COUNT(*) AS cantidad FROM llxbx_societe GROUP BY ref_ext HAVING COUNT(*) > 1;`
    },
    {
      name: 'Duplicados de ref_ext y cliente_id en ll_lugares_clientes',
      sql: `SELECT ref_ext, cliente_id, COUNT(*) AS cantidad FROM ll_lugares_clientes GROUP BY ref_ext, cliente_id HAVING COUNT(*) > 1;`
    },
    {
      name: 'Leads scraping válidos sin representación en ll_lugares_clientes',
      sql: `SELECT l.id, l.nombre FROM ll_lugares l LEFT JOIN ll_lugares_clientes lc ON lc.ref_ext = CONCAT('lugares_', l.id) WHERE l.telefono_wapp IS NOT NULL AND l.telefono_wapp != '' AND lc.id IS NULL LIMIT 20;`
    },
    {
      name: 'Leads Haby válidos sin representación en ll_lugares_clientes',
      sql: `SELECT h.id, h.nombre FROM ll_lugares_haby h LEFT JOIN ll_lugares_clientes lc ON lc.ref_ext = CONCAT('haby_', h.id) WHERE h.telefono_wapp IS NOT NULL AND h.telefono_wapp != '' AND lc.id IS NULL LIMIT 20;`
    }
  ];

  for (const diag of diagnostics) {
    console.log(`\n--- ${diag.name} ---`);
    const [rows] = await conn.query(diag.sql);
    if (rows.length === 0) {
      console.log('OK: Sin registros encontrados.');
    } else {
      console.table(rows);
    }
  }

  await conn.end();
  console.log('\nDiagnóstico final completado.');
}

main().catch(err => {
  console.error('Error en diagnóstico:', err);
  process.exit(1);
});
