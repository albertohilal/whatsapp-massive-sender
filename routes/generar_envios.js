// routes/generar_envios.js
const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

router.get('/lugares', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        nombre,
        telefono,
        rubro,
        direccion
      FROM ll_lugares
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener lugares:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
