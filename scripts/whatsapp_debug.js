const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false,
    executablePath: '/usr/bin/google-chrome', // ruta confirmada en tu sistema
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', qr => {
  console.log('🔑 Escaneá este código QR:');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('🔐 Autenticado correctamente');
});

client.on('ready', () => {
  console.log('✅ WhatsApp listo para usarse');
});

client.on('disconnected', reason => {
  console.log('⚠️ Desconectado:', reason);
});

client.initialize();
