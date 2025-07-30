const pool = require('../db/connection');
const enviarMensaje = require('../bot/whatsapp_debug');

// Obtener campañas activas
const obtenerCampanias = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT id, nombre FROM ll_campanias_whatsapp ORDER BY id DESC`
    );
    conn.release();

    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener campañas:', err);
    res.status(500).json({ error: 'Error al obtener campañas' });
  }
};

// Obtener mensajes pendientes por campaña
const obtenerPendientesPorCampania = async (req, res) => {
  const { campania_id } = req.params;

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT id, telefono_wapp, mensaje_final, estado
       FROM ll_envios_whatsapp
       WHERE campania_id = ? AND estado = 'pendiente'`,
      [campania_id]
    );
    conn.release();

    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener pendientes:', err);
    res.status(500).json({ error: 'Error al obtener pendientes' });
  }
};

// Enviar mensajes de forma manual
const enviarMasivoManual = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No se recibieron IDs válidos' });
  }

  try {
    const conn = await pool.getConnection();

    const [registros] = await conn.query(
      `SELECT id, telefono_wapp, mensaje_final
       FROM ll_envios_whatsapp
       WHERE id IN (?)`,
      [ids]
    );

    let enviados = 0;

    for (const registro of registros) {
      try {
        await enviarMensaje(registro.telefono_wapp, registro.mensaje_final);

        await conn.query(
          `UPDATE ll_envios_whatsapp SET estado = 'enviado', fecha_envio = NOW()
           WHERE id = ?`,
          [registro.id]
        );

        enviados++;
      } catch (err) {
        console.error(`❌ Error al enviar mensaje a ${registro.telefono_wapp}:`, err);
      }
    }

    conn.release();

    res.json({ enviados });
  } catch (err) {
    console.error('❌ Error en el envío manual:', err);
    res.status(500).json({ error: 'Error en el envío manual' });
  }
};

module.exports = {
  obtenerCampanias,
  obtenerPendientesPorCampania,
  enviarMasivoManual
};
