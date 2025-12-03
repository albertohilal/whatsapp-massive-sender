const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

const ensureCliente = (req, res, next) => {
  if (req.session && (req.session.tipo === 'cliente' || req.session.tipo === 'admin')) {
    return next();
  }
  return res.status(403).json({ ok: false, error: 'No autorizado' });
};

router.use((req, res, next) => {
  if (req.baseUrl === '/marketing') {
    return next();
  }
  return ensureCliente(req, res, next);
});

// Campañas de marketing
router.get('/campanias', ensureCliente, async (req, res) => {
  const queryCliente = req.query.cliente_id || req.query.cliente;
  let clienteId;
  if (req.session?.tipo === 'admin' && queryCliente) {
    clienteId = parseInt(queryCliente, 10);
  } else {
    clienteId = req.session?.cliente_id;
  }

  if (!clienteId) {
    return res.json([]);
  }

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT c.id, c.nombre, c.mensaje, c.estado, c.fecha_creacion,
              COUNT(e.id) AS total_envios
       FROM ll_campanias_whatsapp c
       LEFT JOIN ll_envios_whatsapp e ON e.campania_id = c.id
       WHERE c.cliente_id = ?
       GROUP BY c.id
       ORDER BY c.fecha_creacion DESC`,
      [clienteId]
    );
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error('Error al cargar campañas de marketing:', err);
    res.status(500).json({ error: 'Error consultando campañas', details: err.message });
  }
});

// Estado de sesión WhatsApp (simulación por ahora)
router.get('/api/wapp-session', ensureCliente, async (req, res) => {
  res.json({ status: 'desconectado' });
});

router.post('/api/wapp-session/init', ensureCliente, async (req, res) => {
  res.json({ success: true, message: 'Sesión iniciándose...' });
});

router.post('/api/wapp-session/close', ensureCliente, async (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada.' });
});

module.exports = router;
