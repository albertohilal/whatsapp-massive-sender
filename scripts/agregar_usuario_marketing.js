/**
 * Script para agregar el usuario "marketing" a la base de datos
 * Uso: node scripts/agregar_usuario_marketing.js
 */

const pool = require('../db/connection');
const bcrypt = require('bcrypt');

async function agregarUsuarioMarketing() {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Verificar si el usuario ya existe
    const [existing] = await conn.query('SELECT id FROM ll_usuarios WHERE usuario = ?', ['marketing']);
    
    if (existing.length > 0) {
      console.log('✅ El usuario "marketing" ya existe en la base de datos');
      return;
    }
    
    // Crear hash de la contraseña
    // IMPORTANTE: Cambia esta contraseña por una segura
    const password = 'marketing123'; // 🚨 CAMBIAR EN PRODUCCIÓN
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insertar el usuario
    await conn.query(
      'INSERT INTO ll_usuarios (usuario, password_hash, tipo, activo) VALUES (?, ?, ?, ?)',
      ['marketing', passwordHash, 'cliente', 1]
    );
    
    console.log('✅ Usuario "marketing" creado exitosamente');
    console.log('🔑 Usuario: marketing');
    console.log('🔑 Contraseña: marketing123');
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña en producción');
    
  } catch (error) {
    console.error('❌ Error al agregar usuario:', error.message);
  } finally {
    if (conn) conn.release();
    process.exit();
  }
}

agregarUsuarioMarketing();
