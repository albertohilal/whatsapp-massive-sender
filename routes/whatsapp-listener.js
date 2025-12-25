const express = require('express');
const router = express.Router();
const { getHabyClient } = require('./haby');

// Estado de los listeners registrados
const listeners = new Set();

// Registrar listener de mensajes entrantes
router.post('/api/whatsapp/register-listener', (req, res) => {
  const { callbackUrl } = req.body;
  
  if (!callbackUrl) {
    return res.status(400).json({ error: 'callbackUrl requerido' });
  }
  
  listeners.add(callbackUrl);
  console.log(`📡 Listener registrado: ${callbackUrl}`);
  
  res.json({ 
    success: true, 
    message: 'Listener registrado correctamente',
    totalListeners: listeners.size
  });
});

// Desregistrar listener
router.post('/api/whatsapp/unregister-listener', (req, res) => {
  const { callbackUrl } = req.body;
  
  listeners.delete(callbackUrl);
  console.log(`📡 Listener removido: ${callbackUrl}`);
  
  res.json({ 
    success: true, 
    message: 'Listener removido',
    totalListeners: listeners.size
  });
});

// Endpoint para que el bot-responder envíe mensajes
router.post('/api/whatsapp/send', async (req, res) => {
  const { to, message } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({ error: 'to y message son requeridos' });
  }
  
  try {
    const client = getHabyClient();
    
    // Normalizar número para WhatsApp
    const phoneNumber = to.includes('@c.us') ? to : `${to}@c.us`;
    
    await client.sendMessage(phoneNumber, message);
    
    console.log(`✅ Mensaje enviado a ${phoneNumber}: ${message.substring(0, 50)}...`);
    
    res.json({ 
      success: true, 
      message: 'Mensaje enviado correctamente',
      to: phoneNumber
    });
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    res.status(500).json({ 
      error: 'Error enviando mensaje',
      details: error.message
    });
  }
});

// Obtener estado de la conexión
router.get('/api/whatsapp/status', async (req, res) => {
  try {
    const client = getHabyClient();
    const state = await client.getState();
    
    res.json({ 
      connected: true,
      state,
      listeners: listeners.size
    });
  } catch (error) {
    res.json({ 
      connected: false,
      error: error.message,
      listeners: listeners.size
    });
  }
});

// Función para notificar a todos los listeners
async function notifyListeners(message) {
  const axios = require('axios');
  
  for (const url of listeners) {
    try {
      await axios.post(url, message, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error(`❌ Error notificando a ${url}:`, error.message);
    }
  }
}

// Configurar el listener de mensajes cuando el cliente esté listo
function setupMessageListener() {
  try {
    const client = getHabyClient();
    
    client.on('message', async (msg) => {
      console.log(`📨 Mensaje recibido de ${msg.from}: ${msg.body}`);
      
      // Notificar a todos los listeners registrados
      await notifyListeners({
        from: msg.from,
        body: msg.body,
        timestamp: msg.timestamp,
        type: msg.type,
        id: msg.id._serialized
      });
    });
    
    console.log('✅ Message listener configurado');
  } catch (error) {
    console.log('⏳ Cliente WhatsApp aún no disponible, reintentando en 5s...');
    setTimeout(setupMessageListener, 5000);
  }
}

// Intentar configurar el listener
setTimeout(setupMessageListener, 5000);

module.exports = router;
module.exports.notifyListeners = notifyListeners;
