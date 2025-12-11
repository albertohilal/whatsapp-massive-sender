const express = require('express');
const router = express.Router();
// Quitar prospectos seleccionados de una campaña
router.delete('/quitar-de-campania', async (req, res) => {
  const { campaniaId, lugares } = req.body;
  if (!campaniaId || !Array.isArray(lugares) || lugares.length === 0) {
    return res.status(400).json({ success: false, error: 'Datos insuficientes' });
  }
  try {
    const placeholders = lugares.map(() => '?').join(',');
    await connection.query(
      `DELETE FROM ll_envios_whatsapp WHERE campania_id = ? AND lugar_id IN (${placeholders})`,
      [campaniaId, ...lugares]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error al quitar prospectos:', error);
    res.status(500).json({ success: false, error: 'Error al quitar prospectos' });
  }
});
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
      `SELECT id, telefono_wapp, nombre_destino, mensaje_final, estado, lugar_id 
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

      try {
        await connection.query(
          `INSERT INTO ll_envios_whatsapp 
            (campania_id, telefono_wapp, nombre_destino, mensaje_final, estado, fecha_envio, lugar_id)
           VALUES (?, ?, ?, ?, 'pendiente', NULL, ?)`,
          [campaniaId, lugar.telefono_wapp, lugar.nombre, mensajeFinal, lugar.id]
        );
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          // Si el registro ya existe, ignorar y continuar
          continue;
        } else {
          throw err;
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error al agregar prospectos:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, error: 'Algunos prospectos ya estaban asignados a la campaña.' });
    } else {
      res.status(500).json({ success: false, error: 'Error al agregar prospectos' });
    }
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
    
    const { 
      campania, 
      rubro, 
      direccion, 
      wapp_valido, 
      cliente_id, 
      solo_seleccionados,
      estado
    } = req.query;

    const estadoFiltro = (estado || '').trim().toLowerCase();
    const rubroFiltro = rubro && rubro.trim();
    const direccionFiltro = direccion && direccion.trim();
    const params = [];
    let sql;
  
    const requiereEstado = estadoFiltro === 'pendiente' || estadoFiltro === 'enviado';
    const soloSeleccionadosActivos = solo_seleccionados === '1';

    if (requiereEstado) {
      if (!campania) {
        return res.status(400).send('Debe seleccionar una campaña para filtrar por estado.');
      }
      sql = `
        SELECT 
          l.id,
          l.nombre,
          l.direccion,
          l.telefono_wapp,
          l.wapp_valido,
          COALESCE(r.nombre_es, 'Sin rubro') AS rubro,
          e.estado
        FROM ll_envios_whatsapp e
        INNER JOIN ll_lugares l ON e.lugar_id = l.id
        LEFT JOIN ll_rubros r ON l.rubro_id = r.id
        LEFT JOIN ll_campanias_whatsapp camp ON camp.id = e.campania_id
        WHERE e.campania_id = ?
          AND e.estado = ?
      `;
      params.push(campania, estadoFiltro);

      if (cliente_id) {
        sql += ' AND camp.cliente_id = ?';
        params.push(cliente_id);
      }
      if (rubroFiltro) {
        sql += ' AND COALESCE(r.nombre_es, \'Sin rubro\') LIKE ?';
        params.push(`%${rubroFiltro}%`);
      }
      if (direccionFiltro) {
        sql += ' AND l.direccion LIKE ?';
        params.push(`%${direccionFiltro}%`);
      }
      if (wapp_valido === '1') {
        sql += ' AND l.wapp_valido = 1';
      }
      sql += ' ORDER BY l.nombre';
    } else if (soloSeleccionadosActivos && campania) {
      sql = `
        SELECT DISTINCT
          l.id,
          l.nombre,
          l.direccion,
          l.telefono_wapp,
          l.wapp_valido,
          COALESCE(r.nombre_es, 'Sin rubro') AS rubro,
          e.estado
        FROM ll_envios_whatsapp e
        INNER JOIN ll_lugares l ON e.lugar_id = l.id
        LEFT JOIN ll_rubros r ON l.rubro_id = r.id
        LEFT JOIN ll_campanias_whatsapp camp ON camp.id = e.campania_id
        WHERE e.campania_id = ?
      `;
      params.push(campania);

      if (cliente_id) {
        sql += ' AND camp.cliente_id = ?';
        params.push(cliente_id);
      }
      if (rubroFiltro) {
        sql += ' AND COALESCE(r.nombre_es, \'Sin rubro\') LIKE ?';
        params.push(`%${rubroFiltro}%`);
      }
      if (direccionFiltro) {
        sql += ' AND l.direccion LIKE ?';
        params.push(`%${direccionFiltro}%`);
      }
      if (wapp_valido === '1') {
        sql += ' AND l.wapp_valido = 1';
      }
      sql += ' ORDER BY l.nombre';
    } else if (soloSeleccionadosActivos) {
      return res.status(400).send('Debe seleccionar una campaña para ver los prospectos asignados.');
    } else {
      sql = `
        SELECT 
          s.rowid AS id,
          s.nom AS nombre,
          s.address AS direccion,
          s.phone_mobile AS telefono_wapp,
          1 AS wapp_valido,
          COALESCE(r.nombre, 'Sin rubro') AS rubro,
          'sin_envio' AS estado
        FROM llxbx_societe s
        INNER JOIN ll_lugares_clientes lc ON lc.societe_id = s.rowid
        LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
        LEFT JOIN ll_rubros r ON se.rubro_id = r.id
        WHERE s.rowid NOT IN (
          SELECT DISTINCT lugar_id 
          FROM ll_envios_whatsapp 
          WHERE lugar_id IS NOT NULL 
          AND (estado = 'enviado' OR estado = 'pendiente')
        )
      `;

      if (cliente_id) {
        sql += ' AND lc.cliente_id = ?';
        params.push(cliente_id);
      }
      if (rubroFiltro) {
        sql += ' AND COALESCE(r.nombre, \'Sin rubro\') LIKE ?';
        params.push(`%${rubroFiltro}%`);
      }
      if (direccionFiltro) {
        sql += ' AND s.address LIKE ?';
        params.push(`%${direccionFiltro}%`);
      }
      if (wapp_valido === '1') {
        sql += ' AND s.phone_mobile IS NOT NULL AND s.phone_mobile != \'\'';
      }
      sql += ' ORDER BY s.nom';
    }

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
