require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarHabyEnSociete() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  });

  try {
    // Buscar registros de ll_lugares_haby en llxbx_societe por telefono_wapp
    const [rows] = await connection.execute(`
      SELECT h.id AS haby_id, h.telefono_wapp, s.rowid AS societe_rowid, s.phone_mobile
      FROM ll_lugares_haby h
      LEFT JOIN llxbx_societe s ON h.telefono_wapp = s.phone_mobile
      WHERE h.telefono_wapp IS NOT NULL AND h.telefono_wapp != ''
    `);
    console.log('\nRegistros de ll_lugares_haby en llxbx_societe por telefono_wapp:');
    rows.forEach(row => {
      if (row.societe_rowid) {
        console.log(`haby_id: ${row.haby_id}, telefono_wapp: ${row.telefono_wapp} -> Societe rowid: ${row.societe_rowid}`);
      } else {
        console.log(`haby_id: ${row.haby_id}, telefono_wapp: ${row.telefono_wapp} -> NO está en llxbx_societe`);
      }
    });
    await connection.end();
    console.log('\nVerificación finalizada.');
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

verificarHabyEnSociete();