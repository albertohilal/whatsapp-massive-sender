const express = require('express');
const router = express.Router();

// Endpoint para campañas (simulación)
router.get('/campanias', async (req, res) => {
  res.json([]);
});

// Estado de sesión WhatsApp (simulación)
router.get('/api/wapp-session', async (req, res) => {
  res.json({ status: 'desconectado' });
});

// Iniciar sesión WhatsApp (simulación)
router.post('/api/wapp-session/init', async (req, res) => {
  res.json({ success: true, message: 'Sesión iniciándose...' });
});

// Cerrar sesión WhatsApp (simulación)
router.post('/api/wapp-session/close', async (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada.' });
});

module.exports = router;
