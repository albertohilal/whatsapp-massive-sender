const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`SELECT id, nombre FROM ll_rubros ORDER BY nombre`);
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener rubros:', err);
    res.status(500).json({ mensaje: 'Error al obtener rubros' });
  }
});

module.exports = router;
