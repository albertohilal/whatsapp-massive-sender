// Diagnóstico y sincronización de leads Haby entre ll_lugares, ll_lugares_clientes y llxbx_societe
// Solo para leads con telefono_wapp no nulo

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

  // 1. Obtener leads válidos de Haby
  const [habyLeads] = await conn.query(`
    SELECT id, telefono_wapp, ref_ext, nombre FROM ll_lugares_haby WHERE telefono_wapp IS NOT NULL AND telefono_wapp != ''
  `);

  let report = [];
  for (const lead of habyLeads) {
    // 2. Buscar en ll_lugares
    const [lugares] = await conn.query('SELECT id, ref_ext FROM ll_lugares WHERE telefono_wapp = ?', [lead.telefono_wapp]);
    // 3. Buscar en ll_lugares_clientes
    const [clientes] = lugares.length ? await conn.query('SELECT id, ref_ext FROM ll_lugares_clientes WHERE lugar_id = ?', [lugares[0].id]) : [[]];
    // 4. Buscar en llxbx_societe
    const [societe] = await conn.query('SELECT rowid, ref_ext FROM llxbx_societe WHERE phone_mobile = ?', [lead.telefono_wapp]);

    report.push({
      telefono_wapp: lead.telefono_wapp,
      ref_ext_haby: lead.ref_ext,
      lugares: lugares.length ? lugares[0].ref_ext : null,
      clientes: clientes.length ? clientes[0].ref_ext : null,
      societe: societe.length ? societe[0].ref_ext : null
    });
  }
  await conn.end();
  console.table(report);
}

main().catch(err => {
  console.error('Error en diagnóstico de sincronización:', err);
  process.exit(1);
});
