const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { getCliente } = require('../bot/whatsapp_instance'); // ✅ CORREGIDO

router.post('/', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'Falta el ID del mensaje.' });

  try {
    // Buscar el mensaje
    const [rows] = await db.promise().query(
      `SELECT telefono_wapp, mensaje_final FROM ll_envios_whatsapp WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mensaje no encontrado.' });
    }

    const { telefono_wapp, mensaje_final } = rows[0];
    const destino = `${telefono_wapp}@c.us`;

    // Enviar mensaje por WhatsApp
    const client = getCliente(); // ✅ NUEVO
    await client.sendText(destino, mensaje_final); // ✅ USO DIRECTO

    // Marcar como enviado
    await db.promise().query(
      `UPDATE ll_envios_whatsapp SET estado = 'enviado', fecha_envio = NOW() WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: 'Mensaje enviado y marcado como enviado.' });
  } catch (err) {
    console.error('❌ Error en marcar-enviado:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor.' });
  }
});

module.exports = router;
