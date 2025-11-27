
const venom = require('venom-bot');

// Almacena múltiples clientes por sesión
const clientes = {};

/**
 * Inicia una sesión de WhatsApp para un número específico
 * @param {string} sessionName Nombre de la sesión (ej: 'haby', 'cliente2')
 * @returns {Promise}
 */
function iniciarCliente(sessionName = 'whatsapp-massive-sender') {
  return venom
    .create({
      session: sessionName,
      headless: false,
      useChrome: true,
      executablePath: '/usr/bin/google-chrome-stable',
      disableSpins: true,
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: false
      }
    })
    .then((clientInstance) => {
      clientes[sessionName] = clientInstance;
      console.log(`[whatsapp-massive-sender]: Cliente iniciado para sesión ${sessionName}`);
      return clientInstance;
    })
    .catch((erro) => {
      console.error(`[whatsapp-massive-sender]: Error al iniciar el cliente (${sessionName}):`, erro);
      throw erro;
    });
}

/**
 * Obtiene el cliente de una sesión específica
 * @param {string} sessionName
 */
function getCliente(sessionName = 'whatsapp-massive-sender') {
  if (!clientes[sessionName]) {
    throw new Error(`⚠️ Cliente de WhatsApp (${sessionName}) no está inicializado aún.`);
  }
  return clientes[sessionName];
}

/**
 * Envía un mensaje desde una sesión específica
 */
async function sendMessage(sessionName, numero, mensaje) {
  const client = getCliente(sessionName);
  const destinatario = numero.includes('@c.us') ? numero : `${numero}@c.us`;
  return client.sendText(destinatario, mensaje);
}

/**
 * Valida si una sesión está activa
 */
function validarSesion(sessionName = 'whatsapp-massive-sender') {
  return !!clientes[sessionName];
}

/**
 * Lista todas las sesiones activas
 */
function listarSesiones() {
  return Object.keys(clientes);
}

module.exports = {
  iniciarCliente,
  getCliente,
  sendMessage,
  validarSesion,
  listarSesiones
};
