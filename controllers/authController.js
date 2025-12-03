const pool = require('../db/connection');
const bcrypt = require('bcrypt');

module.exports = {
  login: async (req, res) => {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ ok: false, error: 'Faltan datos' });
    }
    try {
      const conn = await pool.getConnection();
      const [rows] = await conn.query('SELECT * FROM ll_usuarios WHERE usuario = ? AND activo = 1', [usuario]);
      conn.release();
      if (rows.length === 0) {
        return res.status(401).json({ ok: false, error: 'Usuario no encontrado o inactivo' });
      }
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
      }
      // Guardar info del usuario usando la sesión existente creada por express-session
      req.session.usuario = user.usuario;
      req.session.tipo = user.tipo;
      req.session.cliente_id = user.cliente_id;
      // Redirigir según tipo de usuario
  let redirect = '/';
  if (user.tipo === 'admin') {
    redirect = '/admin/dashboard.html';
  } else if (user.tipo === 'cliente') {
    if (user.usuario.toLowerCase() === 'haby') {
      redirect = '/haby/dashboard.html';
    } else if (user.usuario.toLowerCase() === 'habysupply') {
      redirect = '/habysupply/dashboard.html';
    } else {
      redirect = `/public/${user.usuario.toLowerCase()}/dashboard.html`;
    }
  }
      return res.json({ ok: true, redirect });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Error en el servidor', details: err.message });
    }
  }
};
