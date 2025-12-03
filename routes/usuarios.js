const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Listar todos los usuarios
router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`
      SELECT 
        id, 
        usuario, 
        tipo, 
        cliente_id, 
        activo,
        created_at,
        updated_at
      FROM ll_usuarios 
      ORDER BY tipo DESC, usuario ASC
    `);
    conn.release();
    res.json({ ok: true, usuarios: rows });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Obtener un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`
      SELECT 
        id, 
        usuario, 
        tipo, 
        cliente_id, 
        activo,
        created_at,
        updated_at
      FROM ll_usuarios 
      WHERE id = ?
    `, [id]);
    conn.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }
    
    res.json({ ok: true, usuario: rows[0] });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { usuario, password, tipo, cliente_id, activo } = req.body;
    
    // Validaciones
    if (!usuario || !password || !tipo) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Faltan datos requeridos: usuario, password y tipo' 
      });
    }
    
    if (!['admin', 'cliente'].includes(tipo)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Tipo debe ser "admin" o "cliente"' 
      });
    }
    
    if (tipo === 'cliente' && !cliente_id) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Para tipo "cliente" se requiere cliente_id' 
      });
    }
    
    // Verificar si el usuario ya existe
    const conn = await pool.getConnection();
    const [existente] = await conn.query(
      'SELECT id FROM ll_usuarios WHERE usuario = ?',
      [usuario]
    );
    
    if (existente.length > 0) {
      conn.release();
      return res.status(400).json({ 
        ok: false, 
        error: 'El usuario ya existe' 
      });
    }
    
    // Hashear password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Crear usuario
    const [result] = await conn.query(
      `INSERT INTO ll_usuarios 
       (usuario, password_hash, tipo, cliente_id, activo) 
       VALUES (?, ?, ?, ?, ?)`,
      [usuario, password_hash, tipo, cliente_id || null, activo !== false ? 1 : 0]
    );
    
    conn.release();
    
    res.json({ 
      ok: true, 
      message: 'Usuario creado exitosamente',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Actualizar usuario
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario, password, tipo, cliente_id, activo } = req.body;
    
    const conn = await pool.getConnection();
    
    // Verificar que el usuario existe
    const [existente] = await conn.query(
      'SELECT id FROM ll_usuarios WHERE id = ?',
      [id]
    );
    
    if (existente.length === 0) {
      conn.release();
      return res.status(404).json({ 
        ok: false, 
        error: 'Usuario no encontrado' 
      });
    }
    
    // Construir query dinámicamente
    const updates = [];
    const values = [];
    
    if (usuario) {
      updates.push('usuario = ?');
      values.push(usuario);
    }
    
    if (password) {
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
      updates.push('password_hash = ?');
      values.push(password_hash);
    }
    
    if (tipo) {
      if (!['admin', 'cliente'].includes(tipo)) {
        conn.release();
        return res.status(400).json({ 
          ok: false, 
          error: 'Tipo debe ser "admin" o "cliente"' 
        });
      }
      updates.push('tipo = ?');
      values.push(tipo);
    }
    
    if (cliente_id !== undefined) {
      updates.push('cliente_id = ?');
      values.push(cliente_id || null);
    }
    
    if (activo !== undefined) {
      updates.push('activo = ?');
      values.push(activo ? 1 : 0);
    }
    
    if (updates.length === 0) {
      conn.release();
      return res.status(400).json({ 
        ok: false, 
        error: 'No hay datos para actualizar' 
      });
    }
    
    values.push(id);
    
    await conn.query(
      `UPDATE ll_usuarios SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    conn.release();
    
    res.json({ 
      ok: true, 
      message: 'Usuario actualizado exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Eliminar usuario (soft delete - cambiar activo a 0)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // No permitir eliminar el usuario logueado
    if (req.session.usuario_id && req.session.usuario_id === parseInt(id)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'No puedes eliminar tu propio usuario' 
      });
    }
    
    const conn = await pool.getConnection();
    
    // Verificar que el usuario existe
    const [existente] = await conn.query(
      'SELECT id FROM ll_usuarios WHERE id = ?',
      [id]
    );
    
    if (existente.length === 0) {
      conn.release();
      return res.status(404).json({ 
        ok: false, 
        error: 'Usuario no encontrado' 
      });
    }
    
    // Soft delete
    await conn.query(
      'UPDATE ll_usuarios SET activo = 0 WHERE id = ?',
      [id]
    );
    
    conn.release();
    
    res.json({ 
      ok: true, 
      message: 'Usuario desactivado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
