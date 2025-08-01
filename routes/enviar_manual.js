const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { getCliente } = require('../bot/whatsapp_instance');

router.post('/', async (req, res) => {
  try {
    const { seleccionados } = req.body;
    const client = getCliente();

    for (const id of seleccionados) {
      const [rows] = await db.query(
        'SELECT telefono_wapp, mensaje_final FROM ll_envios_whatsapp WHERE id = ?',
        [id]
      );

      if (rows.length > 0) {
        const { telefono_wapp, mensaje_final } = rows[0];

        await client.sendText(`${telefono_wapp}@c.us`, mensaje_final);

        await db.query(
          'UPDATE ll_envios_whatsapp SET estado = ?, fecha_envio = NOW() WHERE id = ?',
          ['enviado', id]
        );
        console.log(`✅ Mensaje enviado a ${telefono_wapp}`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
