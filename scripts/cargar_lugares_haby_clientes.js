require('dotenv').config();
const mysql = require('mysql2/promise');

async function cargarLugaresHabyEnClientes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  });

  try {
    // Insertar solo los leads de Haby que no sean duplicados en ll_lugares
    const [result] = await connection.execute(`
      INSERT INTO ll_lugares_clientes (haby_id, cliente_id)
      SELECT h.id, 51
      FROM ll_lugares_haby h
      WHERE h.telefono_wapp IS NOT NULL
        AND h.telefono_wapp != ''
        AND NOT EXISTS (
          SELECT 1 FROM ll_lugares l WHERE l.telefono_wapp = h.telefono_wapp
        );
    `);
    console.log(`Registros insertados: ${result.affectedRows}`);
    await connection.end();
    console.log('Carga finalizada.');
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

cargarLugaresHabyEnClientes();