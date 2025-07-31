// routes/enviar_manual.js
const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Endpoint para actualizar estado de múltiples envíos seleccionados
router.post('/', async (req, res) => {
  try {
    const { envio_ids } = req.body;

    if (!Array.isArray(envio_ids) || envio_ids.length === 0) {
      return res.status(400).json({ error: 'No se recibieron IDs para enviar' });
    }

    const [result] = await pool.query(
      `UPDATE ll_envios_whatsapp 
       SET estado = 'enviado', fecha_envio = NOW() 
       WHERE id IN (?)`,
      [envio_ids]
    );

    res.json({ success: true, updated: result.affectedRows });
  } catch (error) {
    console.error('Error en enviar_manual.js:', error);
    res.status(500).json({ error: 'Error al actualizar estados' });
  }
});

module.exports = router;
