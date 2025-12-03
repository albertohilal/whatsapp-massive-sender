const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Listar todos los clientes para el panel admin
// Listar clientes desde ll_usuarios donde tipo='cliente'
router.get('/api/clientes', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    // Tomar el cliente_id real asociado al usuario de tipo cliente
    const [rows] = await conn.query(`
      SELECT cliente_id AS id, usuario AS nombre
      FROM ll_usuarios
      WHERE tipo='cliente'
        AND cliente_id IS NOT NULL
      ORDER BY usuario
    `);
    conn.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando clientes', details: err.message });
  }
});

// Listar campañas pendientes
router.get('/campanias', async (req, res) => {
  const estado = req.query.estado || 'pendiente';
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      'SELECT c.id, c.nombre, c.mensaje, c.estado, c.cliente_id, cl.nombre AS cliente_nombre FROM ll_campanias_whatsapp c LEFT JOIN clientes cl ON c.cliente_id = cl.id WHERE c.estado = ?',
      [estado]
    );
    conn.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando campañas', details: err.message });
  }
});

// Aprobar campaña
router.post('/campanias/:id/aprobar', async (req, res) => {
  const id = req.params.id;
  try {
    const conn = await pool.getConnection();
    await conn.query('UPDATE ll_campanias_whatsapp SET estado = ? WHERE id = ?', ['aprobada', id]);
    conn.release();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error aprobando campaña', details: err.message });
  }
});

// Enviar campaña (solo cambia estado, la lógica real de envío debe ir en el backend)
router.post('/campanias/:id/enviar', async (req, res) => {
  // Solo el administrador puede enviar campañas
  if (!req.session || req.session.tipo !== 'admin') {
    return res.status(403).json({ error: 'Solo el administrador puede enviar campañas.' });
  }
  const id = req.params.id;
  try {
    const conn = await pool.getConnection();
    await conn.query('UPDATE ll_campanias_whatsapp SET estado = ? WHERE id = ?', ['enviada', id]);
    conn.release();
    // Aquí deberías disparar la lógica de envío real
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error enviando campaña', details: err.message });
  }
});

module.exports = router;
