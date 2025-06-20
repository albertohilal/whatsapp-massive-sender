require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
};

// Inicializa cliente de WhatsApp con autenticación local
const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
  console.log('🔑 Escaneá este QR para conectar WhatsApp:');
  console.log(qr);
});

client.on('ready', async () => {
  console.log('✅ WhatsApp listo para enviar mensajes');

  const connection = await mysql.createConnection(dbConfig);

  try {
    // 1. Buscar mensajes pendientes
    const [pendientes] = await connection.execute(`
      SELECT * FROM ll_envios_whatsapp
      WHERE estado = 'pendiente'
      LIMIT 10
    `);

    if (pendientes.length === 0) {
      console.log('📭 No hay mensajes pendientes para enviar.');
      return;
    }

    for (const envio of pendientes) {
      const numero = envio.telefono;

      try {
        // 2. Enviar mensaje
        const chatId = numero.includes('@c.us') ? numero : `${numero}@c.us`;
        await client.sendMessage(chatId, envio.mensaje_final);

        // 3. Marcar como enviado
        await connection.execute(`
          UPDATE ll_envios_whatsapp
          SET estado = 'enviado', fecha_envio = NOW()
          WHERE id = ?
        `, [envio.id]);

        console.log(`📤 Mensaje enviado a ${numero}`);
      } catch (err) {
        console.error(`❌ Error al enviar a ${numero}: ${err.message}`);

        await connection.execute(`
          UPDATE ll_envios_whatsapp
          SET estado = 'error', fecha_envio = NOW()
          WHERE id = ?
        `, [envio.id]);
      }
    }

  } catch (err) {
    console.error('❌ Error general:', err.message);
  } finally {
    await connection.end();
    client.destroy();
  }
});

client.initialize();
