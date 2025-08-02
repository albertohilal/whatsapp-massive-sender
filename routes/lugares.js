const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET: Listar lugares con filtro por wapp_valido, rubro y dirección
router.get('/', async (req, res) => {
  try {
    const soloValidos = req.query.solo_validos === '1';
    const filtroRubro = req.query.rubro ? req.query.rubro.trim() : '';
    const filtroDireccion = req.query.direccion ? req.query.direccion.trim() : '';

    let sql = `
      SELECT l.id, l.place_id, l.nombre, l.telefono_wapp, l.direccion, l.rubro_id,
             COALESCE(r.nombre_es, 'Sin rubro') AS rubro, l.wapp_valido
      FROM ll_lugares l
      LEFT JOIN ll_rubros r ON l.rubro_id = r.id
      WHERE 1=1
    `;
    const params = [];
    if (soloValidos) {
      sql += ' AND l.wapp_valido = 1 ';
    }
    if (filtroRubro) {
      sql += ' AND COALESCE(r.nombre_es, "Sin rubro") LIKE ? ';
      params.push(`%${filtroRubro}%`);
    }
    if (filtroDireccion) {
      sql += ' AND l.direccion LIKE ? ';
      params.push(`%${filtroDireccion}%`);
    }
    sql += ' ORDER BY l.nombre';

    const conn = await pool.getConnection();
    const [rows] = await conn.query(sql, params);
    conn.release();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ mensaje: 'Error al obtener lugares' });
  }
});

// POST: Crear lugar
router.post('/', async (req, res) => {
  const data = req.body;
  try {
    const conn = await pool.getConnection();
    const sql = `
      INSERT INTO ll_lugares (
        place_id, nombre, telefono_wapp, direccion, rubro_id, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await conn.query(sql, [
      data.place_id || null,
      data.nombre || '',
      data.telefono_wapp || '',
      data.direccion || '',
      data.rubro_id || null
    ]);
    conn.release();
    res.status(201).json({ mensaje: 'Lugar creado con éxito', id: result.insertId });
  } catch (error) {
    console.error('Error al crear lugar:', error);
    res.status(500).json({ mensaje: 'Error al crear lugar' });
  }
});

// PUT: Editar lugar
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const conn = await pool.getConnection();
    let sql, params;
    if (data.place_id) {
      sql = `
        UPDATE ll_lugares SET
          place_id = ?, nombre = ?, telefono_wapp = ?, direccion = ?, rubro_id = ?
        WHERE id = ?
      `;
      params = [data.place_id, data.nombre, data.telefono_wapp, data.direccion, data.rubro_id, id];
    } else {
      sql = `
        UPDATE ll_lugares SET
          nombre = ?, telefono_wapp = ?, direccion = ?, rubro_id = ?
        WHERE id = ?
      `;
      params = [data.nombre, data.telefono_wapp, data.direccion, data.rubro_id, id];
    }
    await conn.query(sql, params);
    conn.release();
    res.json({ mensaje: 'Lugar actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar lugar:', error);
    res.status(500).json({ mensaje: 'Error al actualizar lugar' });
  }
});

// DELETE: Eliminar lugar
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await pool.getConnection();
    await conn.query('DELETE FROM ll_lugares WHERE id = ?', [id]);
    conn.release();
    res.json({ mensaje: 'Lugar eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar lugar:', error);
    res.status(500).json({ mensaje: 'Error al eliminar lugar' });
  }
});

module.exports = router;