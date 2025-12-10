require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarHabyNoEnSociete() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  });

  try {
    // Buscar leads de ll_lugares_haby que no están en llxbx_societe por telefono_wapp
    const [rows] = await connection.execute(`
      SELECT h.id, h.nombre, h.telefono_wapp
      FROM ll_lugares_haby h
      LEFT JOIN llxbx_societe s ON h.telefono_wapp = s.phone_mobile
      WHERE s.rowid IS NULL AND h.telefono_wapp IS NOT NULL AND h.telefono_wapp != ''
    `);
    console.log('\nLeads de ll_lugares_haby que NO están en llxbx_societe:');
    rows.forEach(row => {
      console.log(`haby_id: ${row.id}, nombre: ${row.nombre}, telefono_wapp: ${row.telefono_wapp}`);
    });
    await connection.end();
    console.log('\nVerificación finalizada.');
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

verificarHabyNoEnSociete();