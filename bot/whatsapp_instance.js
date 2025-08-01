const venom = require('venom-bot');

let client = null;

function iniciarCliente() {
  venom
    .create({
      session: 'whatsapp-massive-sender',
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
      client = clientInstance;
      console.log('[whatsapp-massive-sender]: Cliente iniciado');
    })
    .catch((erro) => {
      console.error('[whatsapp-massive-sender]: Error al iniciar el cliente:', erro);
    });
}

function getCliente() {
  if (!client) {
    throw new Error('⚠️ Cliente de WhatsApp no está inicializado aún.');
  }
  return client;
}

async function sendMessage(numero, mensaje) {
  if (!client) throw new Error('Cliente de WhatsApp no está inicializado.');
  // El número debe estar en formato internacional, ej: 54911xxxxxxx@c.us
  const destinatario = numero.includes('@c.us') ? numero : `${numero}@c.us`;
  return client.sendText(destinatario, mensaje);
}

module.exports = {
  iniciarCliente,
  getCliente,
  sendMessage // <-- exporta la función aquí
};
