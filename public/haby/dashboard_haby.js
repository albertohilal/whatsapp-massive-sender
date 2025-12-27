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
      if (data.hasQR || data.qr) {
        console.log('✅ QR disponible en el servidor');
        const qrDiv = document.getElementById('qr-container');
        if (qrDiv) {
          // Usar endpoint del servidor para obtener la imagen del QR
          const timestamp = Date.now(); // Para evitar caché
          qrDiv.innerHTML = `
            <div style="margin-top: 15px; padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">
              <p style="margin-bottom: 15px; font-weight: bold; color: #25D366; font-size: 18px;">📱 Escanea este QR con WhatsApp:</p>
              <div style="display: inline-block; padding: 15px; background: white; border: 3px solid #25D366; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <img src="/haby/api/wapp-session/qr-image?t=${timestamp}" 
                     alt="QR Code WhatsApp" 
                     style="display: block; width: 300px; height: 300px;"
                     onload="console.log('✅ QR image loaded successfully')"
                     onerror="console.error('❌ Error loading QR image'); this.src='/haby/api/wapp-session/qr-image?t=' + Date.now();"/>
              </div>
              <p style="margin-top: 10px; font-size: 14px; color: #666;">El QR se renueva cada 20 segundos</p>
            </div>
          `;
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

// ========== BOT TOGGLE ==========
const botToggle = document.getElementById('bot-toggle');
const botStatusText = document.getElementById('bot-status-text');
const CLIENTE_ID = 51; // Haby cliente_id

async function cargarEstadoBot() {
  try {
    const res = await fetch(`/api/bot-config/status/${CLIENTE_ID}`);
    const data = await res.json();
    
    const activo = data.bot_activo === 1;
    botToggle.checked = activo;
    botStatusText.textContent = activo ? '🤖 Activo (Responde automáticamente)' : '🔇 Solo Escucha';
    botStatusText.style.color = activo ? '#10b981' : '#6b7280';
  } catch (err) {
    console.error('Error cargando estado del bot:', err);
    botStatusText.textContent = 'Error al cargar';
    botStatusText.style.color = '#dc3545';
  }
}

botToggle.addEventListener('change', async (e) => {
  const nuevoEstado = e.target.checked ? 1 : 0;
  botToggle.disabled = true;
  botStatusText.textContent = 'Actualizando...';
  
  try {
    const res = await fetch(`/api/bot-config/toggle/${CLIENTE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_activo: nuevoEstado })
    });
    
    const data = await res.json();
    
    if (data.success) {
      botStatusText.textContent = nuevoEstado ? '🤖 Activo (Responde automáticamente)' : '🔇 Solo Escucha';
      botStatusText.style.color = nuevoEstado ? '#10b981' : '#6b7280';
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (err) {
    console.error('Error actualizando bot:', err);
    alert('Error al actualizar configuración del bot');
    // Revertir el toggle
    botToggle.checked = !e.target.checked;
    await cargarEstadoBot();
  } finally {
    botToggle.disabled = false;
  }
});

// Cargar estado inicial del bot
cargarEstadoBot();
