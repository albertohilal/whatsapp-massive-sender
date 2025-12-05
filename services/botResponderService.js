const pool = require('../db/connection');

async function obtenerEstado(clienteId) {
  if (!clienteId) throw new Error('clienteId requerido');
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      'SELECT responder_activo, actualizado_en, actualizado_por FROM ll_bot_respuestas WHERE cliente_id = ?',
      [clienteId]
    );
    if (!rows.length) {
      return { cliente_id: clienteId, responder_activo: true, actualizado_en: null, actualizado_por: null };
    }
    const row = rows[0];
    return {
      cliente_id: clienteId,
      responder_activo: row.responder_activo === 1,
      actualizado_en: row.actualizado_en,
      actualizado_por: row.actualizado_por || null,
    };
  } finally {
    conn.release();
  }
}

async function actualizarEstado(clienteId, activo, usuario) {
  if (!clienteId) throw new Error('clienteId requerido');
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `INSERT INTO ll_bot_respuestas (cliente_id, responder_activo, actualizado_por)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE responder_activo = VALUES(responder_activo), actualizado_por = VALUES(actualizado_por)`,
      [clienteId, activo ? 1 : 0, usuario || null]
    );
  } finally {
    conn.release();
  }
  return obtenerEstado(clienteId);
}

async function listarEstados() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT u.cliente_id AS id,
             u.usuario AS nombre,
             COALESCE(b.responder_activo, 1) AS responder_activo,
             b.actualizado_en,
             b.actualizado_por
      FROM ll_usuarios u
      LEFT JOIN ll_bot_respuestas b ON b.cliente_id = u.cliente_id
      WHERE u.tipo = 'cliente' AND u.cliente_id IS NOT NULL
      ORDER BY u.usuario
    `);
    return rows.map(row => ({
      cliente_id: row.id,
      nombre: row.nombre,
      responder_activo: row.responder_activo === 1,
      actualizado_en: row.actualizado_en,
      actualizado_por: row.actualizado_por || null,
    }));
  } finally {
    conn.release();
  }
}

module.exports = {
  obtenerEstado,
  actualizarEstado,
  listarEstados,
};
