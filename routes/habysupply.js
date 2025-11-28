// Rutas para panel independiente de habysupply
const express = require('express');
const router = express.Router();
const habysupplyController = require('../controllers/habysupplyController');

// Login
router.post('/login', habysupplyController.login);
// Dashboard
router.get('/dashboard', habysupplyController.dashboard);
// Campañas
router.get('/campanias', habysupplyController.listCampanias);
router.post('/campanias', habysupplyController.crearCampania);
// Prospectos
router.get('/prospectos', habysupplyController.listProspectos);
// Envíos
router.get('/envios', habysupplyController.listEnvios);

// Ruta para servir el dashboard al acceder a /habysupply/
const path = require('path');
router.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../public/habysupply/dashboard.html'));
});

module.exports = router;
