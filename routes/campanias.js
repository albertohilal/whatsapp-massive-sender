const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

// Obtener campañas existentes
router.get('/', async (req, res) => {
  try {
    const [rows] = await connection.query('SELECT id, nombre, mensaje, estado FROM ll_campanias_whatsapp');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener campañas:', error);
    res.status(500).json({ error: 'Error al obtener campañas' });
  }
});

// Crear nueva campaña
router.post('/', async (req, res) => {
  const { nombre, mensaje, estado } = req.body;

  try {
    await connection.query(
      'INSERT INTO ll_campanias_whatsapp (nombre, mensaje, estado, created_at) VALUES (?, ?, ?, NOW())',
      [nombre, mensaje, estado]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error al crear campaña:', error);
    res.status(500).json({ error: 'Error al crear campaña' });
  }
});

module.exports = router;
