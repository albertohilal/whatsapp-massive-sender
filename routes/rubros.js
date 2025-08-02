const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET: Listar rubros con nombre_es
router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT id, nombre_es FROM ll_rubros ORDER BY nombre_es ASC');
    conn.release();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener rubros:', error);
    res.status(500).json({ mensaje: 'Error al obtener rubros' });
  }
});

module.exports = router;