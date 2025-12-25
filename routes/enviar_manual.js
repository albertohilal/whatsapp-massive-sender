const express = require('express');
const router = express.Router();
const { sendMessage } = require('../bot/whatsapp_instance');
const { getHabyClient } = require('./haby');
const connection = require('../db/connection.js');

// Ruta POST para enviar mensajes manualmente
router.post('/', async (req, res) => {
  try {
    const ids = req.body.ids;
    const clienteSession = req.body.session; // Recibir sesión del cliente desde el frontend

    // Validación: debe venir un array de IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'El parámetro "ids" debe ser un array con al menos un ID' });
    }

    // Determinar qué sesión de WhatsApp usar:
    // 1. Si viene 'session' en el body, usar esa (ej: 'haby')
    // 2. Si no, usar el usuario de la sesión en minúsculas
    const sessionName = clienteSession || req.session?.usuario?.toLowerCase() || 'whatsapp-massive-sender';
    console.log(`🔹 Usando sesión de WhatsApp: ${sessionName}`);

    // Recuperar los mensajes desde la base de datos
    const [rows] = await connection.query(
      `SELECT id, telefono_wapp AS telefono, mensaje_final AS mensaje
       FROM ll_envios_whatsapp
       WHERE id IN (?) AND estado != 'enviado'`,
      [ids]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron mensajes pendientes para los IDs proporcionados' });
    }


    // Función para pausar la ejecución
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    for (const envio of rows) {
      const { id, telefono, mensaje } = envio;

      if (!telefono || !mensaje) {
        console.warn(`Datos incompletos en el envío con ID ${id}:`, envio);
        continue;
      }

      console.log(`📤 Enviando a ${telefono} (ID ${id})`);

      try {
        // Si es la sesión 'haby', usar whatsapp-web.js
        if (sessionName === 'haby') {
          try {
            const habyClient = getHabyClient();
            const chatId = telefono.includes('@c.us') ? telefono : `${telefono}@c.us`;
            await habyClient.sendMessage(chatId, mensaje);
          } catch (error) {
            throw new Error(`Cliente Haby no disponible: ${error.message}`);
          }
        } else {
          // Para otras sesiones, usar venom-bot
          await sendMessage(sessionName, telefono, mensaje);
        }

        await connection.query(
          'UPDATE ll_envios_whatsapp SET estado = "enviado", fecha_envio = NOW() WHERE id = ?',
          [id]
        );
      } catch (err) {
        console.error(`❌ Error al enviar mensaje con ID ${id}:`, err.message);
      }

      // Esperar entre 5 y 15 segundos antes de enviar el siguiente mensaje
      const delay = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
      console.log(`⏳ Esperando ${delay / 1000} segundos antes del próximo envío...`);
      await sleep(delay);
    }

    res.json({ success: true, mensaje: 'Mensajes enviados correctamente' });

  } catch (error) {
    console.error('💥 Error general al enviar mensajes:', error);
    res.status(500).json({ error: 'Error interno al procesar los envíos' });
  }
});

module.exports = router;