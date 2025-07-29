const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

// Obtener todas las campañas
router.get('/', async (req, res) => {
  try {
    const [rows] = await connection.query(
      'SELECT id, nombre, mensaje, estado FROM ll_campanias_whatsapp'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener campañas:', error);
    res.status(500).json({ error: 'Error al obtener campañas' });
  }
});

// Obtener campaña por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await connection.query(
      'SELECT id, nombre, mensaje, estado FROM ll_campanias_whatsapp WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener campaña por ID:', error);
    res.status(500).json({ error: 'Error al obtener campaña' });
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

// Actualizar campaña existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, mensaje, estado } = req.body;

  try {
    await connection.query(
      'UPDATE ll_campanias_whatsapp SET nombre = ?, mensaje = ?, estado = ? WHERE id = ?',
      [nombre, mensaje, estado, id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar campaña:', error);
    res.status(500).json({ error: 'Error al actualizar campaña' });
  }
});

// Eliminar campaña
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await connection.query(
      'DELETE FROM ll_campanias_whatsapp WHERE id = ?',
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar campaña:', error);
    res.status(500).json({ error: 'Error al eliminar campaña' });
  }
});

module.exports = router;
