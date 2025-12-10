// Diagnóstico de sincronización entre ll_lugares, ll_lugares_clientes y llxbx_societe
// Solo para registros con teléfono válido

const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  try {
    console.log('Conectando a la base de datos...');
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    });
    console.log('Conexión exitosa.');

    // 1. Obtener todos los teléfonos y ref_ext de ll_lugares
    console.log('Consultando ll_lugares...');
    const [lugares] = await conn.query(`
      SELECT id, telefono_wapp, ref_ext FROM ll_lugares WHERE telefono_wapp IS NOT NULL AND telefono_wapp != ''
    `);
    console.log(`Registros encontrados en ll_lugares: ${lugares.length}`);

    let report = [];
    for (const lugar of lugares) {
      try {
        // 2. Buscar en ll_lugares_clientes
        const [clientes] = await conn.query('SELECT id, ref_ext FROM ll_lugares_clientes WHERE lugar_id = ?', [lugar.id]);
        // 3. Buscar en llxbx_societe
        const [societe] = await conn.query('SELECT rowid, ref_ext FROM llxbx_societe WHERE phone_mobile = ?', [lugar.telefono_wapp]);

        report.push({
          telefono_wapp: lugar.telefono_wapp,
          ref_ext_lugares: lugar.ref_ext,
          ref_ext_clientes: clientes.length ? clientes[0].ref_ext : null,
          ref_ext_societe: societe.length ? societe[0].ref_ext : null
        });
      } catch (innerErr) {
        console.error(`Error consultando para lugar_id ${lugar.id}:`, innerErr);
      }
    }
    await conn.end();
    console.table(report);
  } catch (err) {
    console.error('Error general en el diagnóstico:', err);
  }
}

main().catch(err => {
  console.error('Error en diagnóstico de sincronización:', err);
  process.exit(1);
});
