/**
 * Script de verificación de números WhatsApp
 *
 * Uso:
 *   node scripts/verificar_wapp_lugares.js [all|pendientes] [cliente]
 *
 * Parámetros:
 *   - all: verifica todos los lugares
 *   - pendientes: solo los no verificados (default)
 *   - cliente: nombre del cliente para usar sesión/carpeta específica (default: 'default')
 *
 * Ejemplo:
 *   node scripts/verificar_wapp_lugares.js pendientes habysupply
 *   node scripts/verificar_wapp_lugares.js all otrocliente
 */
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


// Permitir pasar el nombre del cliente como parámetro
const cliente = process.argv[3] || 'default';
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: `tokens/${cliente}`
  }),
  puppeteer: {
    headless: false, // Mostrar ventana Chrome para depuración
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});


client.on('ready', async () => {
  console.log('WhatsApp client listo.');
  let conn;
  try {
    conn = await pool.getConnection();
    // Modo: "all" para todos, "pendientes" para solo no verificados
    const mode = process.argv[2] === 'all' ? 'all' : 'pendientes';
    let query;
    if (mode === 'all') {
      query = 'SELECT id, nombre, telefono_wapp FROM ll_lugares';
    } else {
      query = 'SELECT id, nombre, telefono_wapp FROM ll_lugares WHERE wapp_valido IS NULL OR wapp_valido = -1';
    }
    const [lugares] = await conn.query(query);
    for (let i = 0; i < lugares.length; i += BATCH_SIZE) {
      const batch = lugares.slice(i, i + BATCH_SIZE);
      console.log(`Procesando tanda ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} lugares)...`);
      for (const lugar of batch) {
        let valido = 0;
        const numero = lugar.telefono_wapp ? lugar.telefono_wapp.trim() : '';
        if (isValidPhone(numero)) {
          try {
            const waId = numero + '@c.us';
            // Timeout de 10 segundos por verificación
            valido = await Promise.race([
              client.isRegisteredUser(waId).then(r => r ? 1 : 0),
              sleep(10000).then(() => { console.log(`Timeout verificando ${numero}`); return 0; })
            ]);
          } catch (err) {
            console.log(`Error verificando ${numero}: ${err.message}`);
            valido = 0;
          }
        } else {
          valido = 0;
        }
        await conn.query('UPDATE ll_lugares SET wapp_valido = ? WHERE id = ?', [valido, lugar.id]);
        console.log(`${numero} (${lugar.nombre}): ${valido ? 'Válido' : 'No válido'}`);
      }
      if (i + BATCH_SIZE < lugares.length) {
        console.log(`Esperando ${WAIT_TIME_MS / 1000} segundos antes de la próxima tanda...`);
        await sleep(WAIT_TIME_MS);
      }
    }
    console.log('Verificación terminada.');
    process.exit(0);
  } catch (err) {
    console.error('Error global:', err);
    if (conn) conn.release();
    process.exit(1);
  }
  if (conn) conn.release();
});

client.on('auth_failure', msg => {
  console.error('Error de autenticación WhatsApp:', msg);
});
client.on('disconnected', reason => {
  console.error('Cliente WhatsApp desconectado:', reason);
});

console.log('Inicializando cliente de WhatsApp...');
client.initialize();