// Script Node.js para recrear y poblar la tabla ll_lugares_clientes según el modelo acordado
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

  // 1. Eliminar la tabla ll_lugares_clientes si existe
  console.log('Eliminando tabla ll_lugares_clientes si existe...');
  await conn.query('DROP TABLE IF EXISTS ll_lugares_clientes');

  // 2. Crear la nueva tabla limpia
  console.log('Creando nueva tabla ll_lugares_clientes...');
  await conn.query(`
    CREATE TABLE ll_lugares_clientes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      societe_id INT NOT NULL,
      ref_ext VARCHAR(64) NOT NULL,
      cliente_id INT NOT NULL,
      INDEX idx_societe (societe_id),
      INDEX idx_ref_ext (ref_ext),
      INDEX idx_cliente (cliente_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. Insertar registros scraping (lugares_{$id}) según la lógica de cliente_id
  console.log('Insertando registros scraping (lugares_{$id}) según lógica de cliente_id...');
  // Para id <= 1717, cliente_id = 52
  await conn.query(`
    INSERT INTO ll_lugares_clientes (societe_id, ref_ext, cliente_id)
    SELECT s.rowid, CONCAT('lugares_', l.id), 52
    FROM ll_lugares l
    JOIN llxbx_societe s ON s.ref_ext = CONCAT('lugares_', l.id)
    WHERE l.telefono_wapp IS NOT NULL AND l.telefono_wapp != '' AND l.id <= 1717;
  `);
  // Para id >= 1721, cliente_id = 51
  await conn.query(`
    INSERT INTO ll_lugares_clientes (societe_id, ref_ext, cliente_id)
    SELECT s.rowid, CONCAT('lugares_', l.id), 51
    FROM ll_lugares l
    JOIN llxbx_societe s ON s.ref_ext = CONCAT('lugares_', l.id)
    WHERE l.telefono_wapp IS NOT NULL AND l.telefono_wapp != '' AND l.id >= 1721;
  `);
  // Para id = 1718 y 1719, cliente_id = 51 y 52 (ambos)
  for (const test_id of [1718, 1719]) {
    for (const cliente_id of [51, 52]) {
      await conn.query(`
        INSERT INTO ll_lugares_clientes (societe_id, ref_ext, cliente_id)
        SELECT s.rowid, CONCAT('lugares_', l.id), ?
        FROM ll_lugares l
        JOIN llxbx_societe s ON s.ref_ext = CONCAT('lugares_', l.id)
        WHERE l.telefono_wapp IS NOT NULL AND l.telefono_wapp != '' AND l.id = ?;
      `, [cliente_id, test_id]);
    }
  }

  // 4. Insertar registros Haby (haby_{$id}) para ambos cliente_id 51 y 52
  console.log('Insertando registros Haby (haby_{$id}) para cliente_id 51 y 52...');
  for (const cliente_id of [51, 52]) {
    await conn.query(`
      INSERT INTO ll_lugares_clientes (societe_id, ref_ext, cliente_id)
      SELECT s.rowid, CONCAT('haby_', h.id), ?
      FROM ll_lugares_haby h
      JOIN llxbx_societe s ON s.ref_ext = CONCAT('haby_', h.id)
      WHERE h.telefono_wapp IS NOT NULL AND h.telefono_wapp != '';
    `, [cliente_id]);
  }

  // 5. Sincronizar ll_societe_extended con rubro_id desde ll_lugares
  console.log('Sincronizando ll_societe_extended con rubro_id desde ll_lugares...');
  await conn.query(`
    INSERT INTO ll_societe_extended (societe_id, rubro_id, origen)
    SELECT s.rowid, l.rubro_id, 'google_places'
    FROM llxbx_societe s
    INNER JOIN ll_lugares l ON s.ref_ext = CONCAT('lugares_', l.id)
    WHERE l.rubro_id IS NOT NULL
    ON DUPLICATE KEY UPDATE 
      rubro_id = VALUES(rubro_id),
      origen = VALUES(origen),
      updated_at = CURRENT_TIMESTAMP
  `);

  // 6. Asegurarse de que ll_lugares_haby tenga rubro_id=299 (Tatuajes)
  console.log('Asignando rubro_id=299 a ll_lugares_haby...');
  try {
    await conn.query(`
      UPDATE ll_lugares_haby 
      SET rubro_id = 299 
      WHERE rubro_id IS NULL
    `);
  } catch (err) {
    console.log('⚠️  ll_lugares_haby no tiene campo rubro_id:', err.message);
  }

  // 7. Sincronizar ll_societe_extended con rubro_id desde ll_lugares_haby
  console.log('Sincronizando ll_societe_extended con rubro_id desde ll_lugares_haby...');
  try {
    await conn.query(`
      INSERT INTO ll_societe_extended (societe_id, rubro_id, origen)
      SELECT s.rowid, COALESCE(h.rubro_id, 299), 'haby'
      FROM llxbx_societe s
      INNER JOIN ll_lugares_haby h ON s.ref_ext = CONCAT('haby_', h.id)
      ON DUPLICATE KEY UPDATE 
        rubro_id = VALUES(rubro_id),
        origen = VALUES(origen),
        updated_at = CURRENT_TIMESTAMP
    `);
  } catch (err) {
    console.log('⚠️  Error sincronizando ll_lugares_haby:', err.message);
  }

  await conn.end();
  console.log('¡Tabla ll_lugares_clientes recreada y poblada exitosamente!');
  console.log('¡Tabla ll_societe_extended sincronizada exitosamente!');
}

main().catch(err => {
  console.error('Error recreando/poblando ll_lugares_clientes:', err);
  process.exit(1);
});
