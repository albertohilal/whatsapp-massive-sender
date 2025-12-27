// routes/bot-config.js
// Endpoints para gestionar configuración del bot de respuestas automáticas

const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Obtener estado actual del bot para un cliente
router.get('/status/:clienteId', async (req, res) => {
  const { clienteId } = req.params;
  
  try {
    const [rows] = await pool.execute(
      'SELECT bot_activo, updated_at FROM ll_bot_config WHERE cliente_id = ?',
      [clienteId]
    );
    
    if (rows.length === 0) {
      // Si no existe, crear con bot desactivado
      await pool.execute(
        'INSERT INTO ll_bot_config (cliente_id, bot_activo) VALUES (?, 0)',
        [clienteId]
      );
      return res.json({ bot_activo: 0, mensaje: 'Configuración creada (bot desactivado)' });
    }
    
    res.json({ 
      bot_activo: rows[0].bot_activo,
      updated_at: rows[0].updated_at
    });
  } catch (error) {
    console.error('Error obteniendo estado del bot:', error);
    res.status(500).json({ error: 'Error al obtener configuración del bot' });
  }
});

// Activar/desactivar bot
router.post('/toggle/:clienteId', async (req, res) => {
  const { clienteId } = req.params;
  const { bot_activo } = req.body;
  
  // Validar que bot_activo sea 0 o 1
  if (bot_activo !== 0 && bot_activo !== 1) {
    return res.status(400).json({ error: 'bot_activo debe ser 0 o 1' });
  }
  
  try {
    const [result] = await pool.execute(
      `INSERT INTO ll_bot_config (cliente_id, bot_activo) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE bot_activo = ?, updated_at = NOW()`,
      [clienteId, bot_activo, bot_activo]
    );
    
    const estado = bot_activo === 1 ? 'activadas' : 'desactivadas';
    console.log(`✅ Bot respuestas automáticas ${estado} para cliente ${clienteId}`);
    
    res.json({ 
      success: true,
      bot_activo,
      mensaje: `Respuestas automáticas ${estado}` 
    });
  } catch (error) {
    console.error('Error actualizando configuración del bot:', error);
    res.status(500).json({ error: 'Error al actualizar configuración del bot' });
  }
});

module.exports = router;
