require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarPK() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  });

  try {
    const [rows] = await connection.execute("SHOW KEYS FROM ll_lugares_haby WHERE Key_name = 'PRIMARY'");
    console.log('\nClaves primarias en ll_lugares_haby:');
    rows.forEach(row => {
      console.log(`- Columna: ${row.Column_name}`);
    });
    await connection.end();
    console.log('\nVerificación finalizada.');
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

verificarPK();