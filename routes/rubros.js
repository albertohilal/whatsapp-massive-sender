const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET: Listar rubros con nombre_es
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre_es FROM ll_rubros ORDER BY nombre_es ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener rubros:', error);
    res.status(500).json({ mensaje: 'Error al obtener rubros' });
  }
});

module.exports = router;
