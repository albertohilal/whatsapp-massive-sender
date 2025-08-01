const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const whatsappInstance = require('../bot/whatsapp_instance');
const moment = require('moment');

router.post('/', async (req, res) => {
  const { envios } = req.body;

  if (!Array.isArray(envios) || envios.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron mensajes para enviar.' });
  }

  let enviados = 0;
  const resultados = [];

  for (const envio of envios) {
    const { id, telefono, texto } = envio;

    try {
      const resultado = await whatsappInstance.sendMessage(`${telefono}@c.us`, texto);

      if (resultado?.id?.id) {
        const fechaEnvio = moment().format('YYYY-MM-DD HH:mm:ss');

        const updateResult = await db.query(
          `UPDATE ll_envios_whatsapp
           SET estado = ?, fecha_envio = ?
           WHERE id = ?`,
          ['enviado', fechaEnvio, id]
        );

        resultados.push({
          id,
          telefono,
          estado: 'enviado',
          fecha_envio: fechaEnvio,
          updateResult
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
