// routes/lugares.js
const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET: Listar lugares
router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`
      SELECT 
        l.id,
        l.place_id, 
        l.nombre, 
        l.telefono_wapp, 
        l.direccion,
        l.email,
        l.sitio_web,
        l.latitud,
        l.longitud,
        l.rubro_id,
        r.nombre_es AS rubro,
        l.zona_id,
        l.rating,
        l.reviews,
        l.tipos,
        l.precio,
        l.abierto,
        l.created_at
      FROM ll_lugares l
      LEFT JOIN ll_rubros r ON l.rubro_id = r.id
      ORDER BY l.nombre
    `);
    conn.release();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ mensaje: 'Error al obtener lugares' });
  }
});

router.post('/', async (req, res) => {
  const data = req.body;
  try {
    const conn = await pool.getConnection();
    const sql = `
      INSERT INTO ll_lugares (
        place_id, nombre, telefono, telefono_wapp, direccion, email, sitio_web,
        latitud, longitud, rubro_id, zona_id, rating, reviews, tipos, precio, abierto, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await conn.query(sql, [
      data.place_id || '',
      data.nombre || '',
      data.telefono || '',
      data.telefono_wapp || '',
      data.direccion || '',
      data.email || '',
      data.sitio_web || '',
      data.latitud || null,
      data.longitud || null,
      data.rubro_id || null,
      data.zona_id || null,
      data.rating || null,
      data.reviews || null,
      data.tipos || '',
      data.precio || '',
      data.abierto || ''
    ]);
    conn.release();
    res.status(201).json({ mensaje: 'Lugar creado con éxito', id: result.insertId });
  } catch (error) {
    console.error('Error al crear lugar:', error);
    res.status(500).json({ mensaje: 'Error al crear lugar' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const conn = await pool.getConnection();
    const sql = `
      UPDATE ll_lugares SET
        place_id = ?, nombre = ?, telefono = ?, telefono_wapp = ?, direccion = ?, 
        email = ?, sitio_web = ?, latitud = ?, longitud = ?, rubro_id = ?, zona_id = ?,
        rating = ?, reviews = ?, tipos = ?, precio = ?, abierto = ?
      WHERE id = ?
    `;
    await conn.query(sql, [
      data.place_id || '',
      data.nombre || '',
      data.telefono || '',
      data.telefono_wapp || '',
      data.direccion || '',
      data.email || '',
      data.sitio_web || '',
      data.latitud || null,
      data.longitud || null,
      data.rubro_id || null,
      data.zona_id || null,
      data.rating || null,
      data.reviews || null,
      data.tipos || '',
      data.precio || '',
      data.abierto || '',
      id
    ]);
    conn.release();
    res.json({ mensaje: 'Lugar actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar lugar:', error);
    res.status(500).json({ mensaje: 'Error al actualizar lugar' });
  }
});

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
