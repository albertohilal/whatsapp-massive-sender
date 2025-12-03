// Rutas para panel independiente de habysupply
const express = require('express');
const router = express.Router();
const habysupplyController = require('../controllers/habysupplyController');

const ensureCliente = (req, res, next) => {
  // Permitir acceso si es cliente o admin
  if (req.session && (req.session.tipo === 'cliente' || req.session.tipo === 'admin')) {
    return next();
  }
  if (req.accepts('html')) {
    return res.redirect('/');
  }
  return res.status(403).json({ ok: false, error: 'No autorizado' });
};

// Solo proteger rutas bajo /api, no archivos estáticos
router.use((req, res, next) => {
  if (req.baseUrl.endsWith('/api')) {
    return ensureCliente(req, res, next);
  }
  next();
});

// Login ahora es centralizado en /api/login (authController)
// Dashboard
router.get('/dashboard', habysupplyController.dashboard);
// Campañas
router.get('/campanias', habysupplyController.listCampanias);
router.post('/campanias', habysupplyController.crearCampania);
// Prospectos
router.get('/prospectos', habysupplyController.listProspectos);

// Envios
router.get('/envios', habysupplyController.listEnvios);

// --- Gestión de sesión WhatsApp ---
router.get('/wapp-session', habysupplyController.wappSessionStatus);
router.post('/wapp-session/init', habysupplyController.wappSessionInit);
router.post('/wapp-session/close', habysupplyController.wappSessionClose);

// Ruta para servir el dashboard al acceder a /habysupply/
const path = require('path');
router.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../public/habysupply/dashboard.html'));
});

module.exports = router;
