require('dotenv').config();
const mysql = require('mysql2/promise');

async function actualizarSocieteId() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  });

  try {
    // Obtener todas las asignaciones sin societe_id
    const [asignaciones] = await connection.execute(`
      SELECT id, lugar_id, cliente_id FROM ll_lugares_clientes WHERE societe_id IS NULL
    `);

    for (const asignacion of asignaciones) {
      // Buscar el lead en ll_lugares
      const [leads] = await connection.execute(
        'SELECT * FROM ll_lugares WHERE id = ?',
        [asignacion.lugar_id]
      );
      if (leads.length === 0) {
        console.warn(`Lead no encontrado en ll_lugares para lugar_id=${asignacion.lugar_id}`);
        continue;
      }
      const lead = leads[0];
      const ref_ext = `lugares_${lead.id}`;

      // Buscar en llxbx_societe por ref_ext
      const [societes] = await connection.execute(
        'SELECT rowid FROM llxbx_societe WHERE ref_ext = ?',
        [ref_ext]
      );
      if (societes.length === 0) {
        console.warn(`No existe en llxbx_societe: ref_ext=${ref_ext}`);
        continue;
      }
      const societe_id = societes[0].rowid;

      // Actualizar societe_id en ll_lugares_clientes
      await connection.execute(
        'UPDATE ll_lugares_clientes SET societe_id = ? WHERE id = ?',
        [societe_id, asignacion.id]
      );
      console.log(`Actualizado: ll_lugares_clientes.id=${asignacion.id} => societe_id=${societe_id}`);
    }
    await connection.end();
    console.log('Proceso finalizado.');
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

actualizarSocieteId();