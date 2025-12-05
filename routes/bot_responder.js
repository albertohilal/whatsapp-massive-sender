const express = require('express');
const router = express.Router();
const { obtenerEstado, actualizarEstado, listarEstados } = require('../services/botResponderService');

function resolverClienteId(req, preferido) {
  if (req.session?.tipo === 'admin') {
    const id = preferido || req.body?.cliente_id || req.query?.cliente_id;
    return id ? parseInt(id, 10) : null;
  }
  return req.session?.cliente_id || null;
}

router.get('/', async (req, res) => {
  try {
    const clienteId = resolverClienteId(req);
    if (!clienteId) {
      return res.status(400).json({ error: 'No se pudo determinar el cliente' });
    }
    const estado = await obtenerEstado(clienteId);
    res.json(estado);
  } catch (err) {
    console.error('Error obteniendo estado bot responder:', err);
    res.status(500).json({ error: 'Error consultando estado', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { activo, cliente_id } = req.body || {};
    if (typeof activo === 'undefined') {
      return res.status(400).json({ error: 'Falta el estado "activo"' });
    }
    const clienteId = resolverClienteId(req, cliente_id);
    if (!clienteId) {
      return res.status(400).json({ error: 'No se pudo determinar el cliente' });
    }
    const estado = await actualizarEstado(clienteId, Boolean(activo), req.session?.usuario);
    res.json({ success: true, estado });
  } catch (err) {
    console.error('Error actualizando estado bot responder:', err);
    res.status(500).json({ error: 'Error guardando estado', details: err.message });
  }
});

router.get('/lista', async (req, res) => {
  if (req.session?.tipo !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores' });
  }
  try {
    const estados = await listarEstados();
    res.json(estados);
  } catch (err) {
    console.error('Error listando estados bot responder:', err);
    res.status(500).json({ error: 'Error consultando estados', details: err.message });
  }
});

module.exports = router;
