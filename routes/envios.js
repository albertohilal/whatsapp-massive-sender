const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

// Obtener mensajes pendientes por campaña
router.get('/', async (req, res) => {
  const campaniaId = req.query.campania_id;

  try {
    const [rows] = await connection.query(
      'SELECT id, telefono_wapp, nombre_destino, mensaje_final, estado FROM ll_envios_whatsapp WHERE campania_id = ? AND estado = "pendiente"',
      [campaniaId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener pendientes:', error);
    res.status(500).json({ error: 'Error al obtener pendientes' });
  }
});

// Envío manual desde formulario
router.post('/enviar-masivo-manual', async (req, res) => {
  const { ids } = req.body;
  let enviados = 0;

  try {
    for (const id of ids) {
      const [[registro]] = await connection.query(
        'SELECT telefono_wapp, mensaje_final FROM ll_envios_whatsapp WHERE id = ? AND estado = "pendiente"',
        [id]
      );

      if (registro) {
        // Simula el envío real de WhatsApp aquí
        console.log(`📤 Enviando a ${registro.telefono_wapp}: ${registro.mensaje_final}`);

        await connection.query(
          'UPDATE ll_envios_whatsapp SET estado = "enviado", fecha_envio = NOW() WHERE id = ?',
          [id]
        );

        enviados++;
      }
    }

    res.json({ enviados });
  } catch (error) {
    console.error('Error al enviar mensajes:', error);
    res.status(500).json({ error: 'Error al enviar mensajes' });
  }
});

module.exports = router;
