// Verifica si los lugares faltantes en llxbx_societe están en ll_lugares_haby
// Lee faltantes_lugares_societe.txt y consulta ll_lugares_haby por telefono_wapp

const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
  });

  // Leer TXT
  const lines = fs.readFileSync('faltantes_lugares_societe.txt', 'utf8').split('\n');
  const lugares = lines.map(line => {
    const [id, nombre, telefono_wapp, ref_ext] = line.split('\t');
    return { id, nombre, telefono_wapp, ref_ext };
  });

  let encontrados = [];
  let no_encontrados = [];

  for (const lugar of lugares) {
    const [rows] = await conn.query('SELECT * FROM ll_lugares_haby WHERE telefono_wapp = ?', [lugar.telefono_wapp]);
    if (rows.length) {
      encontrados.push({ ...lugar, nombre_haby: rows[0].nombre });
    } else {
      no_encontrados.push(lugar);
    }
  }
  await conn.end();

  console.log(`Encontrados en ll_lugares_haby: ${encontrados.length}`);
  console.log(`No encontrados en ll_lugares_haby: ${no_encontrados.length}`);

  // Exportar resultados
  fs.writeFileSync('faltantes_encontrados_haby.txt', encontrados.map(l => `${l.id}\t${l.nombre}\t${l.telefono_wapp}\t${l.ref_ext}\t${l.nombre_haby}`).join('\n'));
  fs.writeFileSync('faltantes_no_encontrados_haby.txt', no_encontrados.map(l => `${l.id}\t${l.nombre}\t${l.telefono_wapp}\t${l.ref_ext}`).join('\n'));
  console.log('Exportados: faltantes_encontrados_haby.txt y faltantes_no_encontrados_haby.txt');
}

main().catch(err => {
  console.error('Error verificando lugares en ll_lugares_haby:', err);
  process.exit(1);
});
