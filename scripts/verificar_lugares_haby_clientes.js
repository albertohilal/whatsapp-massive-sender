require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarRelacion() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  });

  try {
    // Verificar si los haby_id de ll_lugares_clientes existen en ll_lugares_haby
    const [rows] = await connection.execute(`
      SELECT lc.haby_id, lh.id
      FROM ll_lugares_clientes lc
      LEFT JOIN ll_lugares_haby lh ON lc.haby_id = lh.id
      WHERE lc.haby_id IS NOT NULL
    `);
    console.log('\nRelación ll_lugares_clientes <-> ll_lugares_haby:');
    rows.forEach(row => {
      if (row.id) {
        console.log(`haby_id ${row.haby_id} existe en ll_lugares_haby.`);
      } else {
        console.log(`haby_id ${row.haby_id} NO existe en ll_lugares_haby.`);
      }
    });
    await connection.end();
    console.log('\nVerificación finalizada.');
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

verificarRelacion();