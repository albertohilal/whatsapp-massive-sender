const express = require('express');
const router = express.Router();
const connection = require('../db/connection');
const {
  obtenerEnvios,
  obtenerEnviosPorCampania,
  obtenerEnviosPendientes,
  obtenerEstadisticasEnvios
} = require('../controllers/enviosController');

// Obtener mensajes pendientes por campaña
router.get('/', async (req, res) => {
  const campaniaId = req.query.campania_id;

  if (!campaniaId) {
    return res.status(400).json({ error: 'Falta campania_id' });
  }

  try {
    const [rows] = await connection.query(
      `SELECT id, telefono_wapp, nombre_destino, mensaje_final, estado 
       FROM ll_envios_whatsapp 
       WHERE campania_id = ? AND estado = 'pendiente'`,
      [campaniaId]
    );

    res.json(rows);
  } catch (error) {
    console.error('❌ Error al obtener pendientes:', error);
    res.status(500).json({ error: 'Error al obtener pendientes' });
  }
});

// Agregar prospectos seleccionados a campaña
router.post('/agregar-a-campania', async (req, res) => {
  const { campaniaId, lugares } = req.body;
  console.log('📥 Datos recibidos:', { campaniaId, lugares });
  
  if (!campaniaId || !Array.isArray(lugares) || lugares.length === 0) {
    return res.status(400).json({ success: false, error: 'Datos insuficientes' });
  }

  try {
    // Obtener el mensaje de la campaña
    const [campaniaRows] = await connection.query(
      `SELECT mensaje FROM ll_campanias_whatsapp WHERE id = ?`,
      [campaniaId]
    );
    if (!campaniaRows.length) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
    }
    const mensajePlantilla = campaniaRows[0].mensaje;

    // Obtener datos de los lugares seleccionados
    const placeholders = lugares.map(() => '?').join(',');
    const [lugaresData] = await connection.query(
      `SELECT l.id, l.nombre, l.telefono_wapp, COALESCE(r.nombre_es, 'Sin rubro') AS rubro, l.direccion 
       FROM ll_lugares l
       LEFT JOIN ll_rubros r ON l.rubro_id = r.id
       WHERE l.id IN (${placeholders}) AND l.wapp_valido = 1`,
      lugares
    );

    // Insertar en ll_envios_whatsapp
    for (const lugar of lugaresData) {
      // Reemplazar los placeholders en el mensaje
      let mensajeFinal = mensajePlantilla
        .replace(/{{nombre}}/gi, lugar.nombre || '')
        .replace(/{{rubro}}/gi, lugar.rubro || 'Sin rubro')
        .replace(/{{direccion}}/gi, lugar.direccion || '');

      await connection.query(
        `INSERT INTO ll_envios_whatsapp 
          (campania_id, telefono_wapp, nombre_destino, mensaje_final, estado, fecha_envio, lugar_id)
         VALUES (?, ?, ?, ?, 'pendiente', NULL, ?)`,
        [campaniaId, lugar.telefono_wapp, lugar.nombre, mensajeFinal, lugar.id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error al agregar prospectos:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ success: false, error: 'Error al agregar prospectos' });
  }
});

// Nuevas rutas usando el controlador
// GET /envios → obtenerEnvios
router.get('/envios', obtenerEnvios);

// GET /envios/campania/:id → obtenerEnviosPorCampania
router.get('/envios/campania/:id', obtenerEnviosPorCampania);

// GET /envios/pendientes → obtenerEnviosPendientes
router.get('/envios/pendientes', obtenerEnviosPendientes);

// GET /envios/estadisticas/:campania_id → obtenerEstadisticasEnvios
router.get('/envios/estadisticas/:campania_id', obtenerEstadisticasEnvios);

// Filtrar prospectos disponibles para envío
router.get('/filtrar-prospectos', async (req, res) => {
  try {
    console.log('🎯 Endpoint /filtrar-prospectos llamado');
    console.log('📥 Query params:', req.query);
    
    // Primero verificar que las tablas existen
    console.log('🔍 Verificando tablas...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'll_%'");
    console.log('📋 Tablas encontradas:', tables);
    
    const { campania, rubro, direccion, wapp_valido } = req.query;
    
    // Consulta base - excluir lugares que tengan envíos en estado 'enviado' o 'pendiente'
    let sql = `
      SELECT 
        ll_lugares.id,
        ll_lugares.nombre,
        ll_lugares.direccion,
        ll_lugares.telefono_wapp,
        ll_lugares.wapp_valido,
        COALESCE(ll_rubros.nombre_es, 'Sin rubro') AS rubro
      FROM ll_lugares
      LEFT JOIN ll_rubros ON ll_lugares.rubro_id = ll_rubros.id
      WHERE ll_lugares.id NOT IN (
        SELECT DISTINCT lugar_id 
        FROM ll_envios_whatsapp 
        WHERE lugar_id IS NOT NULL 
        AND (estado = 'enviado' OR estado = 'pendiente')
      )
    `;

    const params = [];

    // Filtros dinámicos
    if (rubro && rubro.trim()) {
      sql += ' AND COALESCE(ll_rubros.nombre_es, \'Sin rubro\') LIKE ?';
      params.push(`%${rubro.trim()}%`);
    }

    if (direccion && direccion.trim()) {
      sql += ' AND ll_lugares.direccion LIKE ?';
      params.push(`%${direccion.trim()}%`);
    }

    if (wapp_valido === '1') {
      sql += ' AND ll_lugares.wapp_valido = 1';
    }

    // Si se especifica una campaña, filtrar por campaña
    // Note: This filter might not be needed for prospect selection since we're showing available prospects
    // Commenting out the campaign filter for now as it causes SQL errors
    /*
    if (campania && campania.trim()) {
      // Campaign filtering logic would go here
      // But for prospect selection, we typically show all available prospects
    }
    */

    sql += ' ORDER BY ll_lugares.nombre';

    console.log('🔍 SQL query:', sql);
    console.log('🔍 SQL params:', params);
    
    const [rows] = await connection.query(sql, params);
    
    console.log('✅ Query ejecutada exitosamente');
    console.log('📊 Número de filas:', rows.length);
    console.log('🎯 Primeras 3 filas:', rows.slice(0, 3));
    
    res.json(rows);
  } catch (error) {
    console.error('Error al filtrar prospectos:', error);
    res.status(500).json({ error: 'Error al filtrar prospectos' });
  }
});

module.exports = router;