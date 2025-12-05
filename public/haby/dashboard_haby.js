// dashboard_haby.js
// Extraído de public/haby/dashboard.html

const NOMBRE_CLIENTE = 'Haby';
const params = new URLSearchParams(window.location.search);
const modoAdmin = params.get('modo') === 'admin';
const clienteIdModoAdmin = params.get('cliente_id') || params.get('cliente');
const btnVerCampanias = document.querySelector('a.btn-link[href="/haby/campanias.html"]');
const btnProspectos = document.getElementById('btn-prospectos');
const btnProgramaciones = document.getElementById('btn-programaciones');

document.addEventListener('DOMContentLoaded', () => {
  if (btnVerCampanias && modoAdmin && clienteIdModoAdmin) {
    btnVerCampanias.href = `/haby/campanias.html?modo=admin&cliente_id=${clienteIdModoAdmin}`;
  }
  if (btnProspectos && modoAdmin && clienteIdModoAdmin) {
    btnProspectos.href = `/form_envios.html?session=haby&modo=admin&cliente_id=${clienteIdModoAdmin}&cliente_nombre=${encodeURIComponent(NOMBRE_CLIENTE)}`;
  }
  if (btnProgramaciones && modoAdmin && clienteIdModoAdmin) {
    btnProgramaciones.href = `/programaciones.html?modo=admin&cliente_id=${clienteIdModoAdmin}`;
  }
  cargarCampanias();
  cargarEstadoSesion();
});

async function mostrarUsuario() {
  try {
    const res = await fetch('/api/usuario-logueado');
    const data = await res.json();
    if (data && data.usuario) {
      document.getElementById('usuario-logueado').textContent = `Usuario: ${data.usuario}`;
      // Si es un cliente en modo normal, pasar su cliente_id en el enlace
      if (!modoAdmin && data.cliente_id) {
        if (btnVerCampanias) {
          btnVerCampanias.href = `/haby/campanias.html?cliente_id=${data.cliente_id}`;
        }
        if (btnProspectos) {
          btnProspectos.href = `/form_envios.html?session=haby&cliente_id=${data.cliente_id}&cliente_nombre=${encodeURIComponent(NOMBRE_CLIENTE)}`;
        }
        if (btnProgramaciones) {
          btnProgramaciones.href = `/programaciones.html?cliente_id=${data.cliente_id}`;
        }
      }
    }
  } catch (err) {
    document.getElementById('usuario-logueado').textContent = '';
  }
}
mostrarUsuario();

async function cargarCampanias() {
  try {
    const res = await fetch('/haby/campanias');
    await res.json();
  } catch (err) {}
}

async function cargarEstadoSesion() {
  const statusDiv = document.getElementById('wapp-session-status');
  statusDiv.textContent = 'Consultando estado...';
  try {
    const res = await fetch('/haby/api/wapp-session');
    const data = await res.json();
    if (data && data.status) {
      const ok = data.status === 'conectado';
      statusDiv.innerHTML = `<span class="${ok ? 'status-ok' : 'status-off'}">${data.status}</span>`;
      
      // Mostrar QR si está disponible
      if (data.qr) {
        const qrDiv = document.getElementById('qr-container');
        if (qrDiv) {
          // Usar QRCode.js para generar el QR localmente y evitar problemas CORS
          qrDiv.innerHTML = `
            <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px; text-align: center;">
              <p style="margin-bottom: 10px; font-weight: bold; color: #25D366;">📱 Escanea este QR con WhatsApp:</p>
              <div id="qrcode-display" style="display: inline-block; padding: 10px; background: white; border: 3px solid #25D366; border-radius: 8px;"></div>
            </div>
          `;
          
          // Generar QR usando librería
          if (typeof QRCode !== 'undefined') {
            new QRCode(document.getElementById('qrcode-display'), {
              text: data.qr,
              width: 256,
              height: 256,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          } else {
            // Fallback: mostrar como imagen usando Chart API (no tiene CORS)
            document.getElementById('qrcode-display').innerHTML = `
              <img src="https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=${encodeURIComponent(data.qr)}&choe=UTF-8" 
                   alt="QR Code" style="max-width: 256px;"/>
            `;
          }
        }
      } else {
        const qrDiv = document.getElementById('qr-container');
        if (qrDiv) qrDiv.innerHTML = '';
      }
      
      const campaniaSection = document.getElementById('campania-section');
      if (campaniaSection) {
        campaniaSection.style.display = ok ? '' : 'none';
      }
    } else {
      statusDiv.innerHTML = '<span class="status-off">desconectado</span>';
      const qrDiv = document.getElementById('qr-container');
      if (qrDiv) qrDiv.innerHTML = '';
      const campaniaSection = document.getElementById('campania-section');
      if (campaniaSection) {
        campaniaSection.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Error al cargar estado:', err);
    statusDiv.innerHTML = '<span class="status-off">Estado no disponible. Reintenta más tarde.</span>';
    const qrDiv = document.getElementById('qr-container');
    if (qrDiv) qrDiv.innerHTML = '';
    const campaniaSection = document.getElementById('campania-section');
    if (campaniaSection) {
      campaniaSection.style.display = 'none';
    }
  }
}

document.getElementById('wapp-session-init').addEventListener('click', async function() {
  this.disabled = true;
  try {
    const res = await fetch('/haby/api/wapp-session/init', { method: 'POST' });
    const data = await res.json();
    
    if (data.success) {
      alert(data.message || 'Sesión iniciándose... El QR aparecerá abajo en unos segundos.');
      
      // Polling para mostrar el QR
      let intentos = 0;
      const intervalo = setInterval(async () => {
        await cargarEstadoSesion();
        intentos++;
        if (intentos >= 30) { // Detener después de 30 segundos
          clearInterval(intervalo);
        }
      }, 1000);
      
    } else {
      alert(data.message || 'No se pudo iniciar la sesión');
    }
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    alert('Error iniciando sesión. Revisa la consola del servidor.');
  }
  this.disabled = false;
});

document.getElementById('wapp-session-close').addEventListener('click', async function() {
  this.disabled = true;
  try {
    const res = await fetch('/haby/api/wapp-session/close', { method: 'POST' });
    const data = await res.json();
    alert(data.message || (data.success ? 'Sesión cerrada.' : 'No se pudo cerrar'));
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    alert('Error cerrando sesión.');
  }
  this.disabled = false;
  cargarEstadoSesion();
});
