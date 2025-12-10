// Diagnóstico y sincronización de ll_lugares y llxbx_societe para leads con teléfono válido
// Paso 1: Detecta los lugares con teléfono válido que faltan en llxbx_societe
// Paso 2: (opcional) Inserta los faltantes en llxbx_societe

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

  // 1. Obtener todos los lugares con teléfono válido
  const [lugares] = await conn.query(`
    SELECT * FROM ll_lugares WHERE telefono_wapp IS NOT NULL AND telefono_wapp != ''
  `);

  // 2. Obtener todos los societe con ref_ext de lugares
  const [societes] = await conn.query(`
    SELECT ref_ext, phone_mobile FROM llxbx_societe WHERE ref_ext LIKE 'lugares%'
  `);
  const societeRefSet = new Set(societes.map(s => s.ref_ext));

  // 3. Detectar lugares faltantes en societe
  const faltantes = lugares.filter(l => !societeRefSet.has(l.ref_ext));
  console.log(`Lugares con teléfono válido: ${lugares.length}`);
  console.log(`Societes con ref_ext 'lugares%': ${societes.length}`);
  console.log(`Faltantes en llxbx_societe: ${faltantes.length}`);
  if (faltantes.length) {
    const faltantesSimple = faltantes.map(l => ({ id: l.id, nombre: l.nombre, telefono_wapp: l.telefono_wapp, ref_ext: l.ref_ext }));
    console.table(faltantesSimple);
    // Exportar a TXT
    const fs = require('fs');
    const txt = faltantesSimple.map(l => `${l.id}\t${l.nombre}\t${l.telefono_wapp}\t${l.ref_ext}`).join('\n');
    fs.writeFileSync('faltantes_lugares_societe.txt', txt);
    console.log('Exportado a faltantes_lugares_societe.txt');
  } else {
    console.log('No hay faltantes, todo sincronizado.');
  }

  // 4. (Opcional) Insertar los faltantes en llxbx_societe
  // Descomenta para activar la inserción automática
  /*
  for (const l of faltantes) {
    await conn.query(`
      INSERT INTO llxbx_societe (nom, phone_mobile, ref_ext) VALUES (?, ?, ?)
    `, [l.nombre, l.telefono_wapp, l.ref_ext]);
    console.log(`Insertado en llxbx_societe: ${l.nombre} (${l.telefono_wapp})`);
  }
  */

  await conn.end();
}

main().catch(err => {
  console.error('Error en diagnóstico/sincronización:', err);
  process.exit(1);
});
