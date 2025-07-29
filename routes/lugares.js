// routes/lugares.js
const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`
      SELECT 
        l.place_id, 
        l.nombre, 
        l.telefono, 
        l.direccion,
        r.nombre AS rubro
      FROM ll_lugares l
      LEFT JOIN ll_rubros r ON l.rubro_id = r.id
      WHERE l.telefono IS NOT NULL AND l.telefono != ''
      ORDER BY l.nombre LIMIT 100
    `);
    conn.release();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ mensaje: 'Error al obtener lugares' });
  }
});

module.exports = router;
