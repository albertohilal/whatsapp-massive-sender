const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.post('/', async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No se recibieron IDs válidos.' });
  }

  try {
    const placeholders = ids.map(() => '?').join(', ');
    const query = `UPDATE ll_envios_whatsapp SET estado = 'listo', fecha_envio = NOW() WHERE id IN (${placeholders})`;
    const [result] = await db.query(query, ids);

    const cantidad = result.affectedRows || ids.length;
    res.json({ success: true, mensaje: `Se marcaron como listos ${cantidad} mensajes.` });
  } catch (error) {
    console.error('Error en /api/enviar-manual:', error);
    res.status(500).json({ error: 'Error al marcar mensajes como listos.' });
  }
});

module.exports = router;
