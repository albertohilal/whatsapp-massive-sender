const { Client, LocalAuth } = require('whatsapp-web.js');
const pool = require('../db/connection');

const BATCH_SIZE = 50;
const WAIT_TIME_MS = 10000; // 10 segundos

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidPhone(phone) {
  // Verifica formato internacional básico (ej: 549xxxxxxxxx)
  return typeof phone === 'string' && /^549\d{10}$/.test(phone);
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('ready', async () => {
  console.log('WhatsApp client listo.');

  const conn = await pool.getConnection();
  const [lugares] = await conn.query('SELECT id, nombre, telefono_wapp FROM ll_lugares');
  conn.release();

  for (let i = 0; i < lugares.length; i += BATCH_SIZE) {
    const batch = lugares.slice(i, i + BATCH_SIZE);
    console.log(`Procesando tanda ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} lugares)...`);

    for (const lugar of batch) {
      let valido = 0;
      const numero = lugar.telefono_wapp ? lugar.telefono_wapp.trim() : '';
      if (isValidPhone(numero)) {
        try {
          const waId = numero + '@c.us';
          valido = await client.isRegisteredUser(waId) ? 1 : 0;
        } catch (err) {
          console.log(`Error verificando ${numero}: ${err.message}`);
          valido = 0;
        }
      } else {
        valido = 0;
      }
      const conn2 = await pool.getConnection();
      await conn2.query('UPDATE ll_lugares SET wapp_valido = ? WHERE id = ?', [valido, lugar.id]);
      conn2.release();
      console.log(`${numero} (${lugar.nombre}): ${valido ? 'Válido' : 'No válido'}`);
    }

    if (i + BATCH_SIZE < lugares.length) {
      console.log(`Esperando ${WAIT_TIME_MS / 1000} segundos antes de la próxima tanda...`);
      await sleep(WAIT_TIME_MS);
    }
  }

  console.log('Verificación terminada.');
  process.exit(0);
});

client.initialize();