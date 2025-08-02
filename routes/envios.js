const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

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
    const [lugaresData] = await connection.query(
      `SELECT id, nombre, telefono_wapp, COALESCE(r.nombre_es, 'Sin rubro') AS rubro, direccion 
       FROM ll_lugares l
       LEFT JOIN ll_rubros r ON l.rubro_id = r.id
       WHERE l.id IN (?)`,
      [lugares]
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
    res.status(500).json({ success: false, error: 'Error al agregar prospectos' });
  }
});

module.exports = router;