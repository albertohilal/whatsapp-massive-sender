const express = require('express');
const router = express.Router();
const { sendMessage } = require('../bot/whatsapp_instance');
const connection = require('../db/connection.js');

// Ruta POST para enviar mensajes manualmente
router.post('/', async (req, res) => {
  try {
    const ids = req.body.ids;

    // Validación: debe venir un array de IDs
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'El parámetro "ids" debe ser un array con al menos un ID' });
    }

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

    for (const envio of rows) {
      const { id, telefono, mensaje } = envio;

      if (!telefono || !mensaje) {
        console.warn(`Datos incompletos en el envío con ID ${id}:`, envio);
        continue;
      }

      console.log(`📤 Enviando a ${telefono} (ID ${id})`);

      try {
        await sendMessage(telefono, mensaje);

       await connection.query(
  'UPDATE ll_envios_whatsapp SET estado = "enviado", fecha_envio = NOW() WHERE id = ?',
  [id]
);
      } catch (err) {
        console.error(`❌ Error al enviar mensaje con ID ${id}:`, err.message);
      }
    }

    res.json({ success: true, mensaje: 'Mensajes enviados correctamente' });

  } catch (error) {
    console.error('💥 Error general al enviar mensajes:', error);
    res.status(500).json({ error: 'Error interno al procesar los envíos' });
  }
});

module.exports = router;
