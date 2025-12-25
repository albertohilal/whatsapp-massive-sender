const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

const ESTADOS = ['pendiente', 'aprobada', 'rechazada', 'pausada'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const normalizeDays = (dias) => {
  if (Array.isArray(dias)) {
    return dias
      .map((d) => String(d || '').trim().toLowerCase())
      .filter((d) => DAY_KEYS.includes(d));
  }
  if (typeof dias === 'string') {
    return dias
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter((d) => DAY_KEYS.includes(d));
  }
  return [];
};

router.get('/', async (req, res) => {
  try {
    const tipo = req.session?.tipo;
    let sql = `
      SELECT p.*, c.nombre AS campania_nombre
      FROM ll_programaciones p
      LEFT JOIN ll_campanias_whatsapp c ON p.campania_id = c.id
    `;
    const params = [];
    const conditions = [];

    if (tipo === 'cliente') {
      conditions.push('p.cliente_id = ?');
      params.push(req.session.cliente_id);
    } else if (tipo === 'admin' && req.query.cliente_id) {
      conditions.push('p.cliente_id = ?');
      params.push(req.query.cliente_id);
    }

    if (req.query.estado && ESTADOS.includes(req.query.estado)) {
      conditions.push('p.estado = ?');
      params.push(req.query.estado);
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY p.actualizado_en DESC';

    const [rows] = await connection.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error listando programaciones:', err);
    res.status(500).json({ error: 'Error al obtener programaciones' });
  }
});

const obtenerSesionCliente = async (clienteId) => {
  const [rows] = await connection.query(
    'SELECT usuario FROM ll_usuarios WHERE cliente_id = ? LIMIT 1',
    [clienteId]
  );
  if (!rows.length) return null;
  return rows[0].usuario ? rows[0].usuario.toLowerCase() : null;
};

router.post('/', async (req, res) => {
  try {
    const { campania_id, dias_semana, hora_inicio, hora_fin, cupo_diario, fecha_inicio, fecha_fin, comentario } = req.body;
    const tipo = req.session?.tipo;
    const sessionCliente = tipo === 'cliente' ? req.session?.cliente_id : null;
    const clienteId = sessionCliente || req.body?.cliente_id;
    const creadoPor = req.session?.usuario || 'desconocido';
    let sesionCliente = req.session?.usuario ? req.session.usuario.toLowerCase() : null;

    if (!clienteId) {
      return res.status(400).json({ error: 'Falta cliente_id' });
    }
    if (!campania_id || !hora_inicio || !hora_fin || !fecha_inicio) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const diasNormalizados = normalizeDays(dias_semana);
    if (!diasNormalizados.length) {
      return res.status(400).json({ error: 'Selecciona al menos un día de la semana' });
    }

    const [campanias] = await connection.query(
      'SELECT cliente_id FROM ll_campanias_whatsapp WHERE id = ?',
      [campania_id]
    );
    if (!campanias.length) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }
    if (campanias[0].cliente_id !== Number(clienteId)) {
      return res.status(403).json({ error: 'La campaña no pertenece al cliente seleccionado' });
    }

    if (!sesionCliente) {
      sesionCliente = await obtenerSesionCliente(clienteId);
    }

    const [result] = await connection.query(
      `INSERT INTO ll_programaciones
        (campania_id, cliente_id, dias_semana, hora_inicio, hora_fin, cupo_diario, fecha_inicio, fecha_fin, comentario_cliente, creado_por, sesion_cliente)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campania_id,
        clienteId,
        diasNormalizados.join(','),
        hora_inicio,
        hora_fin,
        cupo_diario || 50,
        fecha_inicio,
        fecha_fin || null,
        comentario || null,
        creadoPor,
        sesionCliente
      ]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Error creando programación:', err);
    res.status(500).json({ error: 'Error al crear programación' });
  }
});

// PUT: Actualizar programación existente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { campania_id, dias_semana, hora_inicio, hora_fin, cupo_diario, fecha_inicio, fecha_fin, comentario } = req.body;
    const tipo = req.session?.tipo;
    const sessionCliente = tipo === 'cliente' ? req.session?.cliente_id : null;

    if (!campania_id || !hora_inicio || !hora_fin || !fecha_inicio) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const diasNormalizados = normalizeDays(dias_semana);
    if (!diasNormalizados.length) {
      return res.status(400).json({ error: 'Selecciona al menos un día de la semana' });
    }

    // Verificar que la programación existe y pertenece al cliente
    const [programaciones] = await connection.query(
      'SELECT cliente_id FROM ll_programaciones WHERE id = ?',
      [id]
    );
    
    if (!programaciones.length) {
      return res.status(404).json({ error: 'Programación no encontrada' });
    }

    if (tipo === 'cliente' && programaciones[0].cliente_id !== sessionCliente) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta programación' });
    }

    // Actualizar programación
    await connection.query(
      `UPDATE ll_programaciones 
       SET campania_id = ?, dias_semana = ?, hora_inicio = ?, hora_fin = ?, 
           cupo_diario = ?, fecha_inicio = ?, fecha_fin = ?, comentario_cliente = ?,
           actualizado_en = NOW()
       WHERE id = ?`,
      [
        campania_id,
        diasNormalizados.join(','),
        hora_inicio,
        hora_fin,
        cupo_diario || 50,
        fecha_inicio,
        fecha_fin || null,
        comentario || null,
        id
      ]
    );

    res.json({ success: true, message: 'Programación actualizada correctamente' });
  } catch (err) {
    console.error('Error actualizando programación:', err);
    res.status(500).json({ error: 'Error al actualizar programación' });
  }
});

// DELETE: Eliminar programación
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tipo = req.session?.tipo;
    const sessionCliente = tipo === 'cliente' ? req.session?.cliente_id : null;

    // Verificar que la programación existe y pertenece al cliente
    const [programaciones] = await connection.query(
      'SELECT cliente_id FROM ll_programaciones WHERE id = ?',
      [id]
    );
    
    if (!programaciones.length) {
      return res.status(404).json({ error: 'Programación no encontrada' });
    }

    if (tipo === 'cliente' && programaciones[0].cliente_id !== sessionCliente) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta programación' });
    }

    // Eliminar programación
    await connection.query('DELETE FROM ll_programaciones WHERE id = ?', [id]);

    res.json({ success: true, message: 'Programación eliminada correctamente' });
  } catch (err) {
    console.error('Error eliminando programación:', err);
    res.status(500).json({ error: 'Error al eliminar programación' });
  }
});

// POST: Aprobar programación (solo admin)
router.post('/:id/aprobar', async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario_admin } = req.body;
    const tipo = req.session?.tipo;
    
    if (tipo !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden aprobar programaciones' });
    }

    const aprobadoPor = req.session?.usuario || 'admin';

    await connection.query(
      `UPDATE ll_programaciones 
       SET estado = 'aprobado', 
           comentario_admin = ?, 
           aprobado_por = ?, 
           aprobado_en = NOW() 
       WHERE id = ?`,
      [comentario_admin || null, aprobadoPor, id]
    );

    res.json({ success: true, message: 'Programación aprobada correctamente' });
  } catch (err) {
    console.error('Error aprobando programación:', err);
    res.status(500).json({ error: 'Error al aprobar programación' });
  }
});

// POST: Rechazar programación (solo admin)
router.post('/:id/rechazar', async (req, res) => {
  try {
    const { id } = req.params;
    const { rechazo_motivo } = req.body;
    const tipo = req.session?.tipo;
    
    if (tipo !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden rechazar programaciones' });
    }

    if (!rechazo_motivo || rechazo_motivo.trim() === '') {
      return res.status(400).json({ error: 'Debes indicar un motivo de rechazo' });
    }

    await connection.query(
      `UPDATE ll_programaciones 
       SET estado = 'rechazado', 
           rechazo_motivo = ?,
           aprobado_en = NOW() 
       WHERE id = ?`,
      [rechazo_motivo, id]
    );

    res.json({ success: true, message: 'Programación rechazada' });
  } catch (err) {
    console.error('Error rechazando programación:', err);
    res.status(500).json({ error: 'Error al rechazar programación' });
  }
});

module.exports = router;
