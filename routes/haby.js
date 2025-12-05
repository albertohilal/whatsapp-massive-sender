const express = require('express');
const router = express.Router();
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// Instancia WhatsApp para Haby
let habyClientWrapper = null;
let lastQRCode = null; // Guardar último QR generado

function createHabyWappClient() {
  console.log('🚀 Creando cliente WhatsApp para Haby...');
  
  // Detectar si estamos en producción (servidor sin display)
  const isProduction = process.env.NODE_ENV === 'production' || !process.env.DISPLAY;
  
  habyClientWrapper = {
    client: new Client({
      authStrategy: new LocalAuth({ dataPath: 'tokens/haby' }),
      puppeteer: {
        headless: isProduction ? 'new' : false,
        executablePath: '/usr/bin/google-chrome-stable',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--no-first-run',
          '--no-zygote'
        ]
      }
    }),
    status: 'desconectado',
    initialized: false
  };

  // Evento: Cliente listo
  habyClientWrapper.client.on('ready', () => {
    console.log('✅ Cliente WhatsApp Haby conectado y listo');
    habyClientWrapper.status = 'conectado';
  });

  // Evento: QR Code generado
  habyClientWrapper.client.on('qr', (qr) => {
    console.log('📱 QR Code generado para Haby:');
    console.log(qr);
    lastQRCode = qr; // Guardar para endpoint
  });

  // Evento: Cliente desconectado
  habyClientWrapper.client.on('disconnected', (reason) => {
    console.log('⚠️ Cliente WhatsApp Haby desconectado:', reason);
    habyClientWrapper.status = 'desconectado';
  });

  // Evento: Fallo de autenticación
  habyClientWrapper.client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación WhatsApp Haby:', msg);
    habyClientWrapper.status = 'error';
  });

  // Evento: Autenticación exitosa
  habyClientWrapper.client.on('authenticated', () => {
    console.log('🔐 Cliente WhatsApp Haby autenticado correctamente');
    habyClientWrapper.status = 'autenticado';
    lastQRCode = null; // Limpiar QR después de autenticar
  });

  return habyClientWrapper;
}

function deleteHabySessionData() {
  const dir = path.join(__dirname, '..', 'tokens', 'haby');
  fs.rm(dir, { recursive: true, force: true }, (err) => {
    if (err) console.error('Error eliminando datos de sesión Haby:', err);
    else console.log('🗑️ Datos de sesión Haby eliminados');
  });
}

// Endpoint para campañas (simulación)
router.get('/campanias', async (req, res) => {
  res.json([]);
});

// Estado de sesión WhatsApp
router.get('/api/wapp-session', async (req, res) => {
  if (!habyClientWrapper) {
    return res.json({ status: 'desconectado', qr: null });
  }
  
  const response = {
    status: habyClientWrapper.status,
    qr: lastQRCode // Incluir QR si está disponible
  };
  
  // Log para debug
  if (lastQRCode) {
    console.log(`✅ Enviando QR al frontend (primeros 50 chars): ${lastQRCode.substring(0, 50)}...`);
  }
  
  res.json(response);
});

// Iniciar sesión WhatsApp
router.post('/api/wapp-session/init', async (req, res) => {
  console.log('🔵 Solicitud de iniciar sesión WhatsApp para Haby');
  
  if (!habyClientWrapper) {
    habyClientWrapper = createHabyWappClient();
  }

  if (!habyClientWrapper.initialized) {
    try {
      console.log('📲 Inicializando cliente WhatsApp Haby...');
      habyClientWrapper.client.initialize();
      habyClientWrapper.initialized = true;
      habyClientWrapper.status = 'iniciando';
      return res.json({ 
        success: true, 
        message: 'Inicializando sesión WhatsApp... Escanea el QR desde la ventana de Chrome que se abre o revisa la consola del servidor.' 
      });
    } catch (err) {
      console.error('❌ Error inicializando cliente WhatsApp Haby:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al inicializar sesión WhatsApp',
        error: err.message
      });
    }
  }
  
  res.json({ 
    success: false, 
    message: `Sesión ya iniciada o en proceso (estado: ${habyClientWrapper.status})` 
  });
});

// Cerrar sesión WhatsApp
router.post('/api/wapp-session/close', async (req, res) => {
  console.log('🔴 Solicitud de cerrar sesión WhatsApp para Haby');
  
  if (habyClientWrapper && habyClientWrapper.initialized) {
    try {
      await habyClientWrapper.client.destroy();
      habyClientWrapper = null;
      deleteHabySessionData();
      return res.json({ 
        success: true, 
        message: 'Sesión WhatsApp cerrada y datos eliminados.' 
      });
    } catch (err) {
      console.error('❌ Error cerrando sesión WhatsApp Haby:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al cerrar sesión',
        error: err.message
      });
    }
  }
  
  res.json({ 
    success: false, 
    message: 'No hay sesión activa para cerrar.' 
  });
});

module.exports = router;
