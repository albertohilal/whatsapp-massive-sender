const express = require('express');
const router = express.Router();
const pm2 = require('pm2');

// Obtener estado de los procesos
router.get('/status', (req, res) => {
  pm2.connect(err => {
    if (err) {
      return res.status(500).json({ error: 'Error conectando a PM2' });
    }

    pm2.list((err, processList) => {
      pm2.disconnect();
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo procesos PM2' });
      }

      res.json(processList);
    });
  });
});

// Iniciar proceso
router.post('/start', (req, res) => {
  pm2.connect(err => {
    if (err) return res.status(500).json({ error: 'Error conectando a PM2' });

    pm2.start({
      script: 'index.js',
      name: 'whatsapp-massive',
    }, err => {
      pm2.disconnect();
      if (err) return res.status(500).json({ error: 'Error iniciando el proceso' });
      res.json({ message: 'Proceso iniciado' });
    });
  });
});

// Detener proceso
router.post('/stop', (req, res) => {
  pm2.connect(err => {
    if (err) return res.status(500).json({ error: 'Error conectando a PM2' });

    pm2.stop('whatsapp-massive', err => {
      pm2.disconnect();
      if (err) return res.status(500).json({ error: 'Error deteniendo proceso' });
      res.json({ message: 'Proceso detenido' });
    });
  });
});

// Reiniciar proceso
router.post('/restart', (req, res) => {
  pm2.connect(err => {
    if (err) return res.status(500).json({ error: 'Error conectando a PM2' });

    pm2.restart('whatsapp-massive', err => {
      pm2.disconnect();
      if (err) return res.status(500).json({ error: 'Error reiniciando proceso' });
      res.json({ message: 'Proceso reiniciado' });
    });
  });
});

module.exports = router;
