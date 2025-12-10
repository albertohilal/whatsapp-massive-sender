require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarEstructura() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  });

  try {
    const tablas = ['ll_lugares_clientes', 'll_lugares', 'llxbx_societe'];
    for (const tabla of tablas) {
      const [rows] = await connection.execute(`DESCRIBE ${tabla}`);
      console.log(`\nEstructura de ${tabla}:`);
      rows.forEach(col => {
        console.log(`- ${col.Field} (${col.Type})`);
      });
    }
    await connection.end();
    console.log('\nVerificación finalizada.');
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

verificarEstructura();