const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

router.use((req, res, next) => {
  if (!req.session || req.session.tipo !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores' });
  }
  next();
});

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

// Programaciones
router.get('/programaciones', async (req, res) => {
  const estado = req.query.estado;
  try {
    const conn = await pool.getConnection();
    let sql = `
      SELECT p.*,
             camp.nombre AS campania_nombre,
             u.usuario AS cliente_nombre
      FROM ll_programaciones p
      LEFT JOIN ll_campanias_whatsapp camp ON camp.id = p.campania_id
      LEFT JOIN ll_usuarios u ON u.cliente_id = p.cliente_id
    `;
    const params = [];
    if (estado) {
      sql += ' WHERE p.estado = ?';
      params.push(estado);
    }
    sql += ' ORDER BY p.creado_en DESC';
    const [rows] = await conn.query(sql, params);
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error('Error consultando programaciones:', err);
    res.status(500).json({ error: 'Error consultando programaciones', details: err.message });
  }
});

router.post('/programaciones/:id/aprobar', async (req, res) => {
  const id = req.params.id;
  const comentario = req.body?.comentario || null;
  try {
    const conn = await pool.getConnection();
    await conn.query(
      `UPDATE ll_programaciones
         SET estado = 'aprobada',
             comentario_admin = ?,
             rechazo_motivo = NULL,
             aprobado_por = ?,
             aprobado_en = NOW()
       WHERE id = ?`,
      [comentario, req.session.usuario, id]
    );
    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error('Error aprobando programación:', err);
    res.status(500).json({ error: 'Error al aprobar programación', details: err.message });
  }
});

router.post('/programaciones/:id/rechazar', async (req, res) => {
  const id = req.params.id;
  const motivo = req.body?.motivo || null;
  try {
    const conn = await pool.getConnection();
    await conn.query(
      `UPDATE ll_programaciones
         SET estado = 'rechazada',
             rechazo_motivo = ?,
             comentario_admin = ?,
             aprobado_por = ?,
             aprobado_en = NOW()
       WHERE id = ?`,
      [motivo, req.body?.comentario || null, req.session.usuario, id]
    );
    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error('Error rechazando programación:', err);
    res.status(500).json({ error: 'Error al rechazar programación', details: err.message });
  }
});

router.post('/programaciones/:id/pausar', async (req, res) => {
  const id = req.params.id;
  try {
    const conn = await pool.getConnection();
    await conn.query(
      `UPDATE ll_programaciones
         SET estado = 'pausada',
             comentario_admin = COALESCE(?, comentario_admin)
       WHERE id = ?`,
      [req.body?.comentario || null, id]
    );
    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error('Error pausando programación:', err);
    res.status(500).json({ error: 'Error al pausar programación', details: err.message });
  }
});

router.post('/programaciones/:id/reanudar', async (req, res) => {
  const id = req.params.id;
  try {
    const conn = await pool.getConnection();
    await conn.query(
      `UPDATE ll_programaciones
         SET estado = 'aprobada',
             comentario_admin = COALESCE(?, comentario_admin)
       WHERE id = ?`,
      [req.body?.comentario || null, id]
    );
    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error('Error reanudando programación:', err);
    res.status(500).json({ error: 'Error al reanudar programación', details: err.message });
  }
});

module.exports = router;
