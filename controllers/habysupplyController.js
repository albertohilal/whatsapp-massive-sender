// Controlador para panel habysupply
// --- Instancia WhatsApp por cliente ---
const { Client, LocalAuth } = require('whatsapp-web.js');
const clientesWapp = {};

function getWappClient(cliente) {
  if (!clientesWapp[cliente]) {
    clientesWapp[cliente] = {
      client: new Client({
        authStrategy: new LocalAuth({ dataPath: `tokens/${cliente}` }),
        puppeteer: {
          headless: false, // Mostrar ventana Chrome para escanear QR
          executablePath: '/usr/bin/google-chrome',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      }),
      status: 'desconectado',
      initialized: false
    };
    clientesWapp[cliente].client.on('ready', () => {
      clientesWapp[cliente].status = 'conectado';
    });
    clientesWapp[cliente].client.on('disconnected', () => {
      clientesWapp[cliente].status = 'desconectado';
    });
    clientesWapp[cliente].client.on('auth_failure', () => {
      clientesWapp[cliente].status = 'error';
    });
  }
  return clientesWapp[cliente];
}

module.exports = {
  // --- Gestión de sesión WhatsApp ---
  wappSessionStatus: (req, res) => {
    const cliente = req.session?.cliente || 'habysupply';
    const inst = getWappClient(cliente);
    res.json({ status: inst.status });
  },
  wappSessionInit: (req, res) => {
    const cliente = req.session?.cliente || 'habysupply';
    const inst = getWappClient(cliente);
    if (!inst.initialized) {
      inst.client.initialize();
      inst.initialized = true;
      inst.status = 'iniciando';
      return res.json({ success: true, message: 'Inicializando sesión WhatsApp...' });
    }
    res.json({ success: false, message: 'Sesión ya iniciada o en proceso.' });
  },
  wappSessionClose: (req, res) => {
    const cliente = req.session?.cliente || 'habysupply';
    const inst = getWappClient(cliente);
    if (inst.initialized) {
      inst.client.destroy();
      inst.initialized = false;
      inst.status = 'desconectado';
      return res.json({ success: true, message: 'Sesión cerrada.' });
    }
    res.json({ success: false, message: 'No hay sesión activa.' });
  },
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
