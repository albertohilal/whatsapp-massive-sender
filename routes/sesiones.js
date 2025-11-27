const express = require('express');
const router = express.Router();
const {
  iniciarCliente,
  getCliente,
  validarSesion,
  listarSesiones
} = require('../bot/whatsapp_instance');

// Listar todas las sesiones activas
router.get('/', (req, res) => {
  const sesiones = listarSesiones();
  const estados = sesiones.map(session => ({
    session,
    activo: validarSesion(session)
  }));
  res.json(estados);
});

// Iniciar una nueva sesión y devolver QR
router.post('/iniciar', async (req, res) => {
  const { sessionName } = req.body;
  if (!sessionName) return res.status(400).json({ error: 'Falta sessionName' });
  try {
    const client = await iniciarCliente(sessionName);
    // Esperar evento QR
    client.on('qr', qr => {
      res.json({ session: sessionName, qr });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validar estado de una sesión
router.get('/:sessionName/validar', (req, res) => {
  const { sessionName } = req.params;
  const activo = validarSesion(sessionName);
  res.json({ session: sessionName, activo });
});

// Detener una sesión (no implementado en venom, placeholder)
router.post('/:sessionName/detener', (req, res) => {
  // Aquí podrías implementar lógica para cerrar sesión si la librería lo permite
  res.json({ session: req.params.sessionName, detenido: true });
});

module.exports = router;
