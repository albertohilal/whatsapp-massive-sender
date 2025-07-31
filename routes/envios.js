const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

// Obtener mensajes pendientes por campaña
router.get('/', async (req, res) => {
  const campaniaId = req.query.campania_id;

  if (!campaniaId) {
    return res.status(400).json({ error: 'Falta campania_id' });
  }

  try {
    const [rows] = await connection.query(
      `SELECT id, telefono_wapp, nombre_destino, mensaje_final, estado 
       FROM ll_envios_whatsapp 
       WHERE campania_id = ? AND estado = 'pendiente'`,
      [campaniaId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener pendientes:', error);
    res.status(500).json({ error: 'Error al obtener pendientes' });
  }
});

// Envío manual desde formulario (corrige formato del frontend)
router.post('/enviar-masivo-manual', async (req, res) => {
  const mensajes = req.body.mensajes;
  let enviados = 0;

  if (!Array.isArray(mensajes)) {
    return res.status(400).json({ error: 'mensajes debe ser un array' });
  }

  try {
    for (const msg of mensajes) {
      if (!msg.id || !msg.telefono_wapp || !msg.mensaje_final) {
        console.warn('❌ Mensaje con formato inválido:', msg);
        continue;
      }

      console.log(`📤 Enviando a ${msg.telefono_wapp}: ${msg.mensaje_final}`);

      await connection.query(
        `UPDATE ll_envios_whatsapp 
         SET estado = 'enviado', fecha_envio = NOW() 
         WHERE id = ? AND estado = 'pendiente'`,
        [msg.id]
      );

      enviados++;
    }

    res.json({ enviados });
  } catch (error) {
    console.error('Error al enviar mensajes:', error);
    res.status(500).json({ error: 'Error al enviar mensajes' });
  }
});

module.exports = router;
