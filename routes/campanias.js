const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

router.post('/', async (req, res) => {
  const { nombre, mensaje, estado } = req.body;

  if (!nombre || !mensaje || !estado) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    await pool.execute(`
      INSERT INTO ll_campanias_whatsapp (nombre, mensaje, estado, fecha_creacion)
      VALUES (?, ?, ?, NOW())
    `, [nombre, mensaje, estado]);

    res.json({ message: '✅ Campaña guardada correctamente.' });

  } catch (err) {
    console.error('❌ Error al guardar campaña:', err.message);
    res.status(500).json({ message: 'Error al guardar campaña.' });
  }
});

module.exports = router;
