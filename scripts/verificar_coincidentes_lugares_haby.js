require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarCoincidencias() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  });

  try {
    // Buscar leads coincidentes por telefono_wapp
    const [rows] = await connection.execute(`
      SELECT lh.id AS haby_id, l.id AS lugar_id, lh.telefono_wapp, l.telefono_wapp
      FROM ll_lugares_haby lh
      INNER JOIN ll_lugares l ON lh.telefono_wapp = l.telefono_wapp
      WHERE lh.telefono_wapp IS NOT NULL AND lh.telefono_wapp != ''
    `);
    console.log('\nLeads coincidentes entre ll_lugares_haby y ll_lugares por telefono_wapp:');
    rows.forEach(row => {
      console.log(`haby_id: ${row.haby_id}, lugar_id: ${row.lugar_id}, telefono_wapp: ${row.telefono_wapp}`);
    });
    await connection.end();
    console.log('\nVerificación finalizada.');
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

verificarCoincidencias();