const { execSync, spawnSync } = require('child_process');

try {
  // Verificar si el formulario está siendo servido correctamente
  const html = execSync('curl -s http://localhost:3010/form_envios.html').toString();

  if (html.includes('id="filtrarBtn"')) {
    console.log('✅ El formulario está funcionando correctamente.');
  } else {
    console.log('⚠️ No se encontró el botón de filtro. Verifica el contenido de form_envios.html.');
  }

  // Ejecutar el comando gh codespace ports list sin argumentos
  const portsResult = spawnSync('gh', ['codespace', 'ports', 'list'], { encoding: 'utf-8' });

  if (portsResult.error) {
    throw portsResult.error;
  }

  const portsOutput = portsResult.stdout;
  const match = portsOutput.match(/https:\/\/[^\s]+-p3010\.app\.github\.dev/);

  if (match) {
    console.log(`🔗 Enlace al formulario: ${match[0]}/form_envios.html`);
  } else {
    console.log('❌ No se encontró el enlace público del puerto 3010. Asegúrate de que el servidor esté corriendo y el puerto esté expuesto.');
  }
} catch (err) {
  console.error('❌ Error al verificar el formulario:', err.message);
}
