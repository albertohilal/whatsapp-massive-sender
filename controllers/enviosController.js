const pool = require('../db/connection');

// Obtener envíos con filtros específicos
const obtenerEnvios = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Consulta usando llxbx_societe como fuente principal
    const [rows] = await conn.query(
      `SELECT 
        e.id,
        e.campania_id,
        e.telefono_wapp,
        e.nombre_destino,
        e.mensaje_final,
        e.estado,
        e.fecha_envio,
        e.lugar_id,
        s.nom as lugar_nombre,
        COALESCE(r.nombre, 'Sin rubro') as rubro,
        s.address as direccion,
        s.phone_mobile as telefono,
        CASE WHEN s.phone_mobile IS NOT NULL AND s.phone_mobile != '' THEN 1 ELSE 0 END as wapp_valido,
        r.nombre as rubro_nombre
       FROM ll_envios_whatsapp e
       INNER JOIN llxbx_societe s ON e.lugar_id = s.rowid
       LEFT JOIN ll_lugares_clientes lc ON lc.societe_id = s.rowid
       LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
       LEFT JOIN ll_rubros r ON se.rubro_id = r.id
       WHERE e.estado IN ('enviado', 'pendiente') 
         AND s.phone_mobile IS NOT NULL AND s.phone_mobile != ''
       ORDER BY e.fecha_envio DESC, e.id DESC`
    );
    
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener envíos:', err);
    res.status(500).json({ error: 'Error al obtener envíos' });
  }
};

// Obtener envíos por campaña específica
const obtenerEnviosPorCampania = async (req, res) => {
  const { campania_id } = req.params;
  
  try {
    const conn = await pool.getConnection();
    
    const [rows] = await conn.query(
      `SELECT 
        e.id,
        e.campania_id,
        e.telefono_wapp,
        e.nombre_destino,
        e.mensaje_final,
        e.estado,
        e.fecha_envio,
        e.lugar_id,
        s.nom as lugar_nombre,
        COALESCE(r.nombre, 'Sin rubro') as rubro,
        s.address as direccion,
        s.phone_mobile as telefono,
        CASE WHEN s.phone_mobile IS NOT NULL AND s.phone_mobile != '' THEN 1 ELSE 0 END as wapp_valido,
        r.nombre as rubro_nombre
       FROM ll_envios_whatsapp e
       INNER JOIN llxbx_societe s ON e.lugar_id = s.rowid
       LEFT JOIN ll_lugares_clientes lc ON lc.societe_id = s.rowid
       LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
       LEFT JOIN ll_rubros r ON se.rubro_id = r.id
       WHERE e.campania_id = ?
         AND e.estado IN ('enviado', 'pendiente') 
         AND s.phone_mobile IS NOT NULL AND s.phone_mobile != ''
       ORDER BY e.fecha_envio DESC, e.id DESC`,
      [campania_id]
    );
    
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener envíos por campaña:', err);
    res.status(500).json({ error: 'Error al obtener envíos por campaña' });
  }
};

// Obtener solo envíos pendientes con números válidos
const obtenerEnviosPendientes = async (req, res) => {
  const { campania_id } = req.query;
  
  try {
    const conn = await pool.getConnection();
    
    let query = `SELECT 
      e.id,
      e.campania_id,
      e.telefono_wapp,
      e.nombre_destino,
      e.mensaje_final,
      e.estado,
      e.fecha_envio,
      e.lugar_id,
      s.nom as lugar_nombre,
      COALESCE(r.nombre, 'Sin rubro') as rubro,
      s.address as direccion,
      s.phone_mobile as telefono,
      CASE WHEN s.phone_mobile IS NOT NULL AND s.phone_mobile != '' THEN 1 ELSE 0 END as wapp_valido,
      r.nombre as rubro_nombre
     FROM ll_envios_whatsapp e
     INNER JOIN llxbx_societe s ON e.lugar_id = s.rowid
     LEFT JOIN ll_lugares_clientes lc ON lc.societe_id = s.rowid
     LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
     LEFT JOIN ll_rubros r ON se.rubro_id = r.id
     WHERE e.estado = 'pendiente' 
       AND s.phone_mobile IS NOT NULL AND s.phone_mobile != ''`;
    
    const params = [];
    
    if (campania_id) {
      query += ` AND e.campania_id = ?`;
      params.push(campania_id);
    }
    
    query += ` ORDER BY e.id ASC`;
    
    const [rows] = await conn.query(query, params);
    
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener envíos pendientes:', err);
    res.status(500).json({ error: 'Error al obtener envíos pendientes' });
  }
};

// Obtener estadísticas de envíos por campaña
const obtenerEstadisticasEnvios = async (req, res) => {
  const { campania_id } = req.params;
  
  try {
    const conn = await pool.getConnection();
    
    const [rows] = await conn.query(
      `SELECT 
        e.estado,
        COUNT(*) as total,
        COUNT(CASE WHEN s.phone_mobile IS NOT NULL AND s.phone_mobile != '' THEN 1 END) as con_whatsapp_valido
       FROM ll_envios_whatsapp e
       INNER JOIN llxbx_societe s ON e.lugar_id = s.rowid
       WHERE e.campania_id = ?
       GROUP BY e.estado`,
      [campania_id]
    );
    
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener estadísticas:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

module.exports = {
  obtenerEnvios,
  obtenerEnviosPorCampania,
  obtenerEnviosPendientes,
  obtenerEstadisticasEnvios
};
