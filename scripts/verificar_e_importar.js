require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarEImportar() {
  try {
    // Conexión a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT,
    });

    console.log('Conexión exitosa a la base de datos.');

    // Verificar duplicados
    const [duplicados] = await connection.execute(`
      SELECT l.telefono_wapp
      FROM ll_lugares l
      JOIN llxbx_societe s ON l.telefono_wapp = s.phone_mobile;
    `);

    if (duplicados.length > 0) {
      console.log('Registros duplicados encontrados:');
      console.table(duplicados);
    } else {
      console.log('No se encontraron duplicados.');
    }

    // Importar registros únicos usando NOT EXISTS y validando campos
    const [importados] = await connection.execute(`
      INSERT INTO llxbx_societe (phone_mobile, ref_ext, nom, address)
      SELECT l.telefono_wapp, CONCAT('lugares_', l.id), l.nombre, l.direccion
      FROM ll_lugares l
      WHERE l.telefono_wapp IS NOT NULL
        AND l.telefono_wapp != ''
        AND NOT EXISTS (
          SELECT 1 FROM llxbx_societe s WHERE s.phone_mobile = l.telefono_wapp
        );
    `);

    console.log(`Registros importados: ${importados.affectedRows}`);

    // Cerrar conexión
    await connection.end();
    console.log('Conexión cerrada.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

verificarEImportar();