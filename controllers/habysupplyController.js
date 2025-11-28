// Controlador para panel habysupply
module.exports = {
  login: (req, res) => {
    // Autenticación básica (ejemplo)
    const { usuario, password } = req.body;
    if (usuario === 'habysupply' && password === 'tu_clave_segura') {
      req.session.cliente = 'habysupply';
      return res.json({ ok: true });
    }
    res.status(401).json({ ok: false, error: 'Credenciales incorrectas' });
  },
  dashboard: (req, res) => {
    // Renderizar dashboard (placeholder)
    res.sendFile('dashboard.html', { root: 'public/habysupply' });
  },
  listCampanias: async (req, res) => {
    // Listar campañas solo de habysupply (cliente_id=51)
    const pool = require('../db/connection');
    try {
      const conn = await pool.getConnection();
      const [rows] = await conn.query(`
        SELECT DISTINCT c.id, c.nombre, c.mensaje, c.fecha_creacion, c.estado
        FROM ll_campanias_whatsapp c
        JOIN ll_envios_whatsapp e ON c.id = e.campania_id
        JOIN ll_lugares_clientes lc ON e.lugar_id = lc.lugar_id
        WHERE lc.cliente_id = 51
      `);
      conn.release();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Error consultando campañas', details: err.message });
    }
  },

  crearCampania: async (req, res) => {
    // Crear campaña nueva para habysupply
    const pool = require('../db/connection');
    const { nombre, mensaje } = req.body;
    if (!nombre || !mensaje) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    try {
      const conn = await pool.getConnection();
        const [result] = await conn.query(
          'INSERT INTO ll_campanias_whatsapp (nombre, mensaje, estado) VALUES (?, ?, ?)',
          [nombre, mensaje, 'pendiente']
      );
      conn.release();
      res.json({ ok: true, id: result.insertId });
    } catch (err) {
      res.status(500).json({ error: 'Error creando campaña', details: err.message });
    }
  },
  listProspectos: async (req, res) => {
    // Listar prospectos solo de habysupply (cliente_id=51)
    const pool = require('../db/connection');
    try {
      const conn = await pool.getConnection();
      const [rows] = await conn.query(`
        SELECT l.id, l.nombre, l.telefono_wapp, l.email
        FROM ll_lugares l
        JOIN ll_lugares_clientes lc ON l.id = lc.lugar_id
        WHERE lc.cliente_id = 51
      `);
      conn.release();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Error consultando prospectos', details: err.message });
    }
  },
  listEnvios: (req, res) => {
    // Listar envíos solo de habysupply
    // ...consulta SQL filtrada por cliente...
    res.json([]);
  }
};
