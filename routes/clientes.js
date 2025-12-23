const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

// GET /api/clientes/:id/areas-asignadas
router.get('/:id/areas-asignadas', async (req, res) => {
  try {
    const clienteId = req.params.id;
    if (!clienteId) return res.status(400).json({ error: 'Falta clienteId' });

    // Autorización básica: admin o el mismo cliente
    const sess = req.session || {};
    const esAdmin = sess.tipo === 'admin';
    const esMismoCliente = String(sess.cliente_id || sess.cliente) === String(clienteId);
    if (!esAdmin && !esMismoCliente) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Verificar si existe tabla ll_clientes_areas
    const [tab] = await connection.query("SHOW TABLES LIKE 'll_clientes_areas'");
    if (!Array.isArray(tab) || tab.length === 0) {
      return res.json({ areas: [] });
    }

    const [rows] = await connection.query(
      `SELECT area FROM ll_clientes_areas WHERE cliente_id = ? ORDER BY area`,
      [clienteId]
    );
    const areas = rows.map(r => r.area).filter(Boolean);
    return res.json({ areas });
  } catch (err) {
    console.error('Error en áreas asignadas:', err);
    return res.status(500).json({ error: 'Error al obtener áreas asignadas' });
  }
});

module.exports = router;
