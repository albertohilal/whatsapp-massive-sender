/**
 * Script para crear usuarios con password hasheado usando bcrypt
 * 
 * Uso:
 *   node scripts/crear_usuario.js <usuario> <password> <tipo> [cliente_id]
 * 
 * Ejemplos:
 *   node scripts/crear_usuario.js b3toh miPassword123 admin
 *   node scripts/crear_usuario.js habysupply Haby2025! cliente 51
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../db/connection');

const SALT_ROUNDS = 10;

async function crearUsuario(usuario, password, tipo, cliente_id = null) {
  try {
    // Validar datos
    if (!usuario || !password || !tipo) {
      throw new Error('Faltan parámetros: usuario, password y tipo son requeridos');
    }

    if (password.length < 6 || password.length > 13) {
      throw new Error('La contraseña debe tener entre 6 y 13 caracteres');
    }

    if (!['admin', 'cliente'].includes(tipo)) {
      throw new Error('Tipo debe ser "admin" o "cliente"');
    }


    if (tipo === 'cliente' && !cliente_id) {
      throw new Error('Para tipo "cliente" se requiere cliente_id');
    }
    // Verificar si ya existe un usuario con ese cliente_id
    if (tipo === 'cliente') {
      const connCheck = await pool.getConnection();
      const [clienteDuplicado] = await connCheck.query(
        'SELECT id, usuario FROM ll_usuarios WHERE tipo = "cliente" AND cliente_id = ?',
        [cliente_id]
      );
      connCheck.release();
      if (clienteDuplicado.length > 0 && clienteDuplicado[0].usuario !== usuario) {
        throw new Error(`Ya existe un usuario tipo cliente con cliente_id ${cliente_id}: ${clienteDuplicado[0].usuario}`);
      }
    }

    console.log(`\n🔐 Creando usuario: ${usuario}`);
    console.log(`   Tipo: ${tipo}`);
    if (cliente_id) console.log(`   Cliente ID: ${cliente_id}`);

    // Hashear password
    console.log('\n⏳ Hasheando password...');
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log(`✅ Password hasheado: ${password_hash.substring(0, 20)}...`);

    // Conectar a base de datos
    const conn = await pool.getConnection();

    // Verificar si el usuario ya existe
    const [existente] = await conn.query(
      'SELECT id, usuario FROM ll_usuarios WHERE usuario = ?',
      [usuario]
    );

    if (existente.length > 0) {
      console.log('\n⚠️  El usuario ya existe. ¿Desea actualizar el password? (y/n)');
      
      // En modo script, actualizamos automáticamente
      console.log('   Actualizando password...');
      await conn.query(
        'UPDATE ll_usuarios SET password_hash = ?, tipo = ?, cliente_id = ? WHERE usuario = ?',
        [password_hash, tipo, cliente_id, usuario]
      );
      console.log(`✅ Password actualizado para usuario: ${usuario}`);
    } else {
      // Crear nuevo usuario
      await conn.query(
        'INSERT INTO ll_usuarios (usuario, password_hash, tipo, cliente_id, activo) VALUES (?, ?, ?, ?, 1)',
        [usuario, password_hash, tipo, cliente_id]
      );
      console.log(`✅ Usuario creado exitosamente: ${usuario}`);
    }

    conn.release();

    // Mostrar resumen
    console.log('\n📋 Resumen:');
    console.log(`   Usuario: ${usuario}`);
    console.log(`   Tipo: ${tipo}`);
    if (cliente_id) console.log(`   Cliente ID: ${cliente_id}`);
    console.log(`   Estado: activo`);
    console.log('\n✨ Listo! Ahora puedes iniciar sesión con estas credenciales.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Leer argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('\n❌ Uso incorrecto');
  console.log('\n📖 Uso:');
  console.log('   node scripts/crear_usuario.js <usuario> <password> <tipo> [cliente_id]');
  console.log('\n📝 Ejemplos:');
  console.log('   node scripts/crear_usuario.js b3toh miPassword123 admin');
  console.log('   node scripts/crear_usuario.js habysupply Haby2025! cliente 51');
  console.log('\n⚠️  El password debe tener entre 6 y 13 caracteres.');
  console.log('⚠️  El password será hasheado con bcrypt antes de guardarse.\n');
  process.exit(1);
}

const [usuario, password, tipo, cliente_id] = args;

// Ejecutar
crearUsuario(usuario, password, tipo, cliente_id || null);
