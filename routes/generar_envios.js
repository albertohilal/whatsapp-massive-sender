const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const moment = require('moment');

// Importar el sistema de clientes WhatsApp de habysupply
const habysupplyController = require('../controllers/habysupplyController');

// Ruta para enviar mensajes masivos desde una campaña
router.post('/', async (req, res) => {
  const { envios, cliente } = req.body;

  if (!Array.isArray(envios) || envios.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron mensajes para enviar.' });
  }

  // Determinar el cliente (habysupply por defecto o el especificado)
  const clienteNombre = cliente || req.session?.cliente || 'habysupply';
  console.log(`📤 Enviando ${envios.length} mensajes usando sesión de cliente: ${clienteNombre}`);

  let enviados = 0;
  const resultados = [];

  // Obtener instancia de WhatsApp del cliente
  const clienteWapp = habysupplyController.getWappClient(clienteNombre);
  
  if (!clienteWapp || !clienteWapp.initialized || clienteWapp.status !== 'conectado') {
    return res.status(400).json({ 
      error: 'Sesión de WhatsApp no disponible',
      details: `El cliente ${clienteNombre} debe iniciar sesión en WhatsApp primero.`
    });
  }

  for (const envio of envios) {
    const { id, telefono, texto } = envio;

    if (!telefono || !texto) {
      resultados.push({
        id,
        telefono,
        estado: 'error',
        error: 'Datos incompletos'
      });
      console.warn(`⚠️ Datos incompletos para ID ${id}:`, envio);
      continue;
    }

    try {
      const resultado = await clienteWapp.client.sendMessage(`${telefono}@c.us`, texto);

      if (resultado?.id?.id) {
        const fechaEnvio = moment().format('YYYY-MM-DD HH:mm:ss');

        await db.query(
          `UPDATE ll_envios_whatsapp
           SET estado = ?, fecha_envio = ?
           WHERE id = ?`,
          ['enviado', fechaEnvio, id]
        );

        resultados.push({
          id,
          telefono,
          estado: 'enviado',
          fecha_envio: fechaEnvio
        });

        console.log(`✅ Mensaje enviado y marcado como 'enviado' para ID ${id}`);
        enviados++;
      } else {
        resultados.push({
          id,
          telefono,
          estado: 'error',
          error: 'No se generó ID de mensaje'
        });

        console.error(`❌ No se pudo enviar el mensaje a ${telefono}`, resultado);
      }

    } catch (error) {
      resultados.push({
        id,
        telefono,
        estado: 'error',
        error: error.message
      });

      console.error(`❌ Error al enviar el mensaje a ${telefono}`, error);
    }
  }

  console.log('\n📋 Resultado completo de los envíos:');
  console.table(resultados, ['id', 'telefono', 'estado', 'fecha_envio']);

  res.json({
    mensaje: `Se marcaron como listos ${enviados} mensajes.`,
    enviados,
    resultados
  });
});

module.exports = router;