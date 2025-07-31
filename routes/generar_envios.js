const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// CORREGIDO: usar ruta base "/"
router.post('/', async (req, res) => {
  try {
    const { campania_id, place_ids } = req.body;

    if (!campania_id || !Array.isArray(place_ids) || place_ids.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Obtener plantilla de la campaña
    const [[campania]] = await pool.query(
      `SELECT mensaje FROM ll_campanias_whatsapp WHERE id = ?`,
      [campania_id]
    );

    if (!campania || !campania.mensaje) {
      return res.status(404).json({ error: 'Campaña no encontrada o sin mensaje' });
    }

    const plantilla = campania.mensaje;

    // Obtener datos de los lugares con rubro
    const [lugares] = await pool.query(
      `
      SELECT 
        l.place_id, 
        l.nombre, 
        l.telefono_wapp, 
        r.nombre AS rubro
      FROM ll_lugares l
      LEFT JOIN ll_rubros r ON l.rubro_id = r.id
      WHERE l.place_id IN (?) AND l.telefono_wapp IS NOT NULL AND l.telefono_wapp != ''
      `,
      [place_ids]
    );

    // Armar valores a insertar
    const valores = lugares.map(l => {
      const mensajePersonalizado = plantilla
        .replace(/{{\s*nombre\s*}}/gi, l.nombre || '')
        .replace(/{{\s*rubro\s*}}/gi, l.rubro || '');

      return [
        campania_id,
        l.telefono_wapp,
        l.nombre || '',
        mensajePersonalizado,
        'pendiente',
        fecha
      ];
    });

    // Insertar en ll_envios_whatsapp
    const sql = `
      INSERT INTO ll_envios_whatsapp 
        (campania_id, telefono_wapp, nombre_destino, mensaje_final, estado, fecha_envio)
      VALUES ?
    `;

    await pool.query(sql, [valores]);

    res.json({ success: true, inserted: valores.length });
  } catch (error) {
    console.error('Error al generar envíos:', error);
    res.status(500).json({ error: 'Error al generar envíos' });
  }
});

module.exports = router;
