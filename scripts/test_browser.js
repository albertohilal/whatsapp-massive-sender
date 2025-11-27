const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://example.com');
    console.log('✅ Chrome abierto con Puppeteer');

    setTimeout(async () => {
      await browser.close();
      console.log('✅ Chrome cerrado');
    }, 10000); // cierra luego de 10 segundos

  } catch (err) {
    console.error('❌ Error al abrir Chrome:', err);
  }
})();
