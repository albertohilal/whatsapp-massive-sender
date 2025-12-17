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


    // Obtener datos de los lugares seleccionados desde llxbx_societe y enriquecidos
    const placeholders = lugares.map(() => '?').join(',');
    const [lugaresData] = await connection.query(
      `SELECT 
         s.rowid AS id,
         s.nom AS nombre,
         s.phone_mobile AS telefono_wapp,
         COALESCE(r.nombre_es, 'Sin rubro') AS rubro,
         s.address AS direccion
       FROM llxbx_societe s
       INNER JOIN ll_lugares_clientes lc ON lc.societe_id = s.rowid
       LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
       LEFT JOIN ll_rubros r ON se.rubro_id = r.id
       WHERE s.rowid IN (${placeholders})
         AND s.phone_mobile IS NOT NULL AND s.phone_mobile != ''
    `,
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
      estado,
      area,
      tipo_cliente
    } = req.query;
    // Normalizar posibles arrays en query (duplicados)
    const first = (v) => Array.isArray(v) ? v[0] : v;
    const campaniaParam = first(campania);
    const rubroParam = first(rubro);
    const direccionParam = first(direccion);
    const wappValidoParam = first(wapp_valido);
    const clienteIdParam = first(cliente_id);
    const soloSeleccionadosParam = first(solo_seleccionados);
    const estadoParam = first(estado);
    const areaParam = first(area);
    const tipoClienteParam = first(tipo_cliente);
    // Mapear filtro de tipo de cliente
    const tipoCliente = (tipoClienteParam || '').trim().toLowerCase();
    const aplicarFiltroCliente = (sqlWhereArray, sqlParamsArray, tableAlias = 's') => {
      if (tipoCliente === 'clientes') {
        sqlWhereArray.push(`${tableAlias}.client IN (1,3)`);
      } else if (tipoCliente === 'prospectos') {
        sqlWhereArray.push(`${tableAlias}.client IN (2,3)`);
      } else if (tipoCliente === 'solo_clientes') {
        sqlWhereArray.push(`${tableAlias}.client = 1`);
      } else if (tipoCliente === 'solo_prospectos') {
        sqlWhereArray.push(`${tableAlias}.client = 2`);
      }
      // 'ambos' o vacío: no agrega condición
    };

    const estadoFiltro = String(estadoParam || '').trim().toLowerCase();
    const rubroFiltro = rubroParam ? String(rubroParam).trim() : null;
    const areaFiltro = areaParam ? String(areaParam).trim() : null;
    const direccionFiltro = direccionParam ? String(direccionParam).trim() : null;
    const params = [];
    let sql;
    // Helper para generar patrones tolerantes a variantes comunes (ej. tattoo/tatoo/tatu)
    const getRubroPatterns = (term) => {
      if (!term) return [];
      const q = String(term).toLowerCase().trim();
      const patterns = new Set();
      // patrón base
      patterns.add(`%${q}%`);
      // colapsar letras duplicadas (tattoo -> tato)
      const collapsed = q.replace(/(.)\1+/g, '$1');
      patterns.add(`%${collapsed}%`);
      // reemplazo simple de 'oo' -> 'u' (tattoo -> tatu)
      patterns.add(`%${q.replace(/oo/g, 'u')}%`);
      // sinónimos manuales frecuentes para este dominio
      if (/tatto?o/.test(q) || q.includes('tatu')) {
        patterns.add('%tatu%');
        patterns.add('%tatua%');
      }
      return Array.from(patterns);
    };
  
    const requiereEstado = estadoFiltro === 'pendiente' || estadoFiltro === 'enviado';
    const soloSeleccionadosActivos = soloSeleccionadosParam === '1';

    if (requiereEstado) {
      if (!campaniaParam) {
        return res.status(400).send('Debe seleccionar una campaña para filtrar por estado.');
      }
      sql = `
        SELECT 
          s.rowid AS id,
          s.nom AS nombre,
          s.address AS direccion,
          s.phone_mobile AS telefono_wapp,
          CASE WHEN s.phone_mobile IS NOT NULL AND s.phone_mobile <> '' THEN 1 ELSE 0 END AS wapp_valido,
          COALESCE(r.nombre_es, 'Sin rubro') AS rubro,
          r.area AS area,
          e.estado
        FROM ll_envios_whatsapp e
        INNER JOIN llxbx_societe s ON e.lugar_id = s.rowid
        LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
        LEFT JOIN ll_rubros r ON se.rubro_id = r.id
        LEFT JOIN ll_campanias_whatsapp camp ON camp.id = e.campania_id
        WHERE e.campania_id = ?
          AND e.estado = ?
      `;
      params.push(campaniaParam, estadoFiltro);
      // Filtro por tipo de cliente
      const whereExtra = [];
      aplicarFiltroCliente(whereExtra, params, 's');
      if (whereExtra.length) {
        sql += ' AND ' + whereExtra.join(' AND ');
      }

      if (clienteIdParam) {
        sql += ' AND camp.cliente_id = ?';
        params.push(clienteIdParam);
      }
      if (areaFiltro) {
        sql += ' AND r.area = ?';
        params.push(areaFiltro);
      } else if (rubroFiltro) {
        const rubroPatterns = getRubroPatterns(rubroFiltro);
        if (rubroPatterns.length) {
          sql += ' AND (' + rubroPatterns.map(() => "LOWER(COALESCE(r.nombre_es, 'Sin rubro')) LIKE ?").join(' OR ') + ')';
          params.push(...rubroPatterns.map(p => p.toLowerCase()));
        }
      }
      if (direccionFiltro) {
        sql += ' AND s.address LIKE ?';
        params.push(`%${direccionFiltro}%`);
      }
      if (wappValidoParam === '1') {
        sql += " AND s.phone_mobile IS NOT NULL AND s.phone_mobile <> ''";
      }
      sql += ' ORDER BY s.nom';
    } else if (soloSeleccionadosActivos && campaniaParam) {
      sql = `
        SELECT DISTINCT
          s.rowid AS id,
          s.nom AS nombre,
          s.address AS direccion,
          s.phone_mobile AS telefono_wapp,
          CASE WHEN s.phone_mobile IS NOT NULL AND s.phone_mobile <> '' THEN 1 ELSE 0 END AS wapp_valido,
          COALESCE(r.nombre_es, 'Sin rubro') AS rubro,
          r.area AS area,
          e.estado
        FROM ll_envios_whatsapp e
        INNER JOIN llxbx_societe s ON e.lugar_id = s.rowid
        LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
        LEFT JOIN ll_rubros r ON se.rubro_id = r.id
        LEFT JOIN ll_campanias_whatsapp camp ON camp.id = e.campania_id
        WHERE e.campania_id = ?
      `;
      params.push(campaniaParam);
      // Filtro por tipo de cliente
      const whereExtra2 = [];
      aplicarFiltroCliente(whereExtra2, params, 's');
      if (whereExtra2.length) {
        sql += ' AND ' + whereExtra2.join(' AND ');
      }

      if (clienteIdParam) {
        sql += ' AND camp.cliente_id = ?';
        params.push(clienteIdParam);
      }
      if (areaFiltro) {
        sql += ' AND r.area = ?';
        params.push(areaFiltro);
      } else if (rubroFiltro) {
        const rubroPatterns = getRubroPatterns(rubroFiltro);
        if (rubroPatterns.length) {
          sql += ' AND (' + rubroPatterns.map(() => "LOWER(COALESCE(r.nombre_es, 'Sin rubro')) LIKE ?").join(' OR ') + ')';
          params.push(...rubroPatterns.map(p => p.toLowerCase()));
        }
      }
      if (direccionFiltro) {
        sql += ' AND s.address LIKE ?';
        params.push(`%${direccionFiltro}%`);
      }
      if (wappValidoParam === '1') {
        sql += " AND s.phone_mobile IS NOT NULL AND s.phone_mobile <> ''";
      }
      sql += ' ORDER BY s.nom';
    } else if (soloSeleccionadosActivos) {
      return res.status(400).send('Debe seleccionar una campaña para ver los prospectos asignados.');
    } else {
      sql = `
        SELECT 
          s.rowid AS id,
          s.nom AS nombre,
          s.address AS direccion,
          s.phone_mobile AS telefono_wapp,
          CASE WHEN s.phone_mobile IS NOT NULL AND s.phone_mobile <> '' THEN 1 ELSE 0 END AS wapp_valido,
          COALESCE(r.nombre_es, 'Sin rubro') AS rubro,
          r.area AS area,
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
      // Filtro por tipo de cliente en sin_envio
      const whereExtra3 = [];
      aplicarFiltroCliente(whereExtra3, params, 's');
      if (whereExtra3.length) {
        sql += ' AND ' + whereExtra3.join(' AND ');
      }

      if (clienteIdParam) {
        sql += ' AND lc.cliente_id = ?';
        params.push(clienteIdParam);
      }
      if (areaFiltro) {
        sql += ' AND r.area = ?';
        params.push(areaFiltro);
      } else if (rubroFiltro) {
        const rubroPatterns = getRubroPatterns(rubroFiltro);
        if (rubroPatterns.length) {
          sql += ' AND (' + rubroPatterns.map(() => "LOWER(COALESCE(r.nombre_es, 'Sin rubro')) LIKE ?").join(' OR ') + ')';
          params.push(...rubroPatterns.map(p => p.toLowerCase()));
        }
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

    // Log temporal: listar prospectos que retornan 'Sin rubro'
    const sinRubro = rows.filter(r => (r.rubro || '').toLowerCase().includes('sin rubro'));
    if (sinRubro.length > 0) {
      console.warn('⚠️ Prospectos retornando "Sin rubro":', sinRubro.map(r => ({ id: r.id, nombre: r.nombre, telefono: r.telefono_wapp, direccion: r.direccion })));
    } else {
      console.log('✅ Todos los prospectos tienen rubro asignado.');
    }

    // Normalizar respuesta para Playwright: siempre { prospectos: [...] }
    res.json({ prospectos: rows });
  } catch (error) {
    console.error('Error al filtrar prospectos:', error);
    res.status(500).json({ error: 'Error al filtrar prospectos' });
  }
});

// Listado de áreas disponibles (según prospectos sin envío para el cliente)
router.get('/areas', async (req, res) => {
  try {
    const { cliente_id } = req.query;
    const params = [];
    let sql = `
      SELECT DISTINCT r.area AS area
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
      AND r.area IS NOT NULL AND r.area <> ''
    `;
    if (cliente_id) {
      sql += ' AND lc.cliente_id = ?';
      params.push(cliente_id);
    }
    sql += ' ORDER BY r.area';

    const [rows] = await connection.query(sql, params);
    const areas = rows.map(r => r.area);
    res.json({ areas });
  } catch (error) {
    console.error('Error al obtener áreas:', error);
    res.status(500).json({ error: 'Error al obtener áreas' });
  }
});

module.exports = router;
