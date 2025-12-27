// scripts/forzar_envio_50.js
// Script para forzar el envío de los primeros 50 mensajes pendientes de una campaña y registrar correctamente en ll_ia_conversaciones

require('dotenv').config();
const db = require('../db/connection');
const habysupplyController = require('../controllers/habysupplyController');
const moment = require('moment');

const CAMPAÑA_ID = 46; // Leads primer mensaje
const LIMITE = 50;
const CLIENTE_ID = 51; // Haby (ajustar si es necesario)

async function main() {
  // Obtener instancia de WhatsApp
  const clienteWapp = habysupplyController.getWappClient('haby');
  if (!clienteWapp || !clienteWapp.initialized || clienteWapp.status !== 'conectado') {
    console.error('❌ Sesión de WhatsApp no disponible para Haby.');
    process.exit(1);
  }

  // Obtener los primeros 50 pendientes
  const [pendientes] = await db.query(
    `SELECT id, telefono_wapp, mensaje_final FROM ll_envios_whatsapp WHERE campania_id = ? AND estado = 'pendiente' ORDER BY id ASC LIMIT ?`,
    [CAMPAÑA_ID, LIMITE]
  );
  if (!pendientes.length) {
    console.log('No hay mensajes pendientes para enviar.');
    return;
  }

  for (const envio of pendientes) {
    try {
      const destinatario = envio.telefono_wapp.includes('@c.us') ? envio.telefono_wapp : `${envio.telefono_wapp}@c.us`;
      await clienteWapp.client.sendMessage(destinatario, envio.mensaje_final);
      const fechaEnvio = moment().format('YYYY-MM-DD HH:mm:ss');
      // Marcar como enviado
      await db.query(
        `UPDATE ll_envios_whatsapp SET estado = 'enviado', fecha_envio = ? WHERE id = ?`,
        [fechaEnvio, envio.id]
      );
      // Registrar en ll_ia_conversaciones (rol=bot, mensaje=mensaje_final)
      await db.query(
        `INSERT INTO ll_ia_conversaciones (cliente_id, telefono, rol, mensaje, created_at) VALUES (?, ?, 'bot', ?, ?)` ,
        [CLIENTE_ID, envio.telefono_wapp, envio.mensaje_final, fechaEnvio]
      );
      console.log(`✅ Enviado y registrado: ${envio.telefono_wapp}`);
    } catch (err) {
      console.error(`❌ Error con ${envio.telefono_wapp}:`, err.message);
    }
  }
  console.log('Proceso finalizado.');
}

main().then(() => process.exit(0));
