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
router.post('/generar-envios', async (req, res) => {
  const { campania_id, lugares } = req.body;
  if (!campania_id || !Array.isArray(lugares) || lugares.length === 0) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  try {
    // Inserta un envío por cada lugar seleccionado
    const values = lugares.map(lugar_id => [campania_id, lugar_id]);
    await pool.query(
      'INSERT INTO ll_envios (campania_id, lugar_id) VALUES ?',
      [values]
    );
    res.json({ mensaje: 'Envíos generados correctamente' });
  } catch (err) {
    console.error('Error al generar envíos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
