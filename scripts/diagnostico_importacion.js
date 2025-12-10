require('dotenv').config();
const mysql = require('mysql2/promise');

async function diagnosticoImportacion() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT,
    });

    console.log('Conexión exitosa a la base de datos.');

    // 1. ¿Cuántos registros candidatos hay para importar?
    const [candidatos] = await connection.execute(`
      SELECT COUNT(*) AS total
      FROM ll_lugares l
      WHERE l.telefono_wapp IS NOT NULL AND l.telefono_wapp != ''
        AND l.telefono_wapp NOT IN (SELECT phone_mobile FROM llxbx_societe);
    `);
    console.log('Registros candidatos para importar:', candidatos[0].total);

    // 2. ¿Cuántos registros de ll_lugares tienen telefono_wapp vacío o nulo?
    const [sinTelefono] = await connection.execute(`
      SELECT COUNT(*) AS total
      FROM ll_lugares
      WHERE telefono_wapp IS NULL OR telefono_wapp = '';
    `);
    console.log('Registros en ll_lugares sin telefono_wapp:', sinTelefono[0].total);

    // 3. ¿Cuántos registros únicos hay en llxbx_societe?
    const [societeUnicos] = await connection.execute(`
      SELECT COUNT(DISTINCT phone_mobile) AS total
      FROM llxbx_societe;
    `);
    console.log('Registros únicos en llxbx_societe:', societeUnicos[0].total);

    await connection.end();
    console.log('Diagnóstico finalizado.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

diagnosticoImportacion();