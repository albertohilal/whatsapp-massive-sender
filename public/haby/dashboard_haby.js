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
      const campaniaSection = document.getElementById('campania-section');
      if (campaniaSection) {
        campaniaSection.style.display = ok ? '' : 'none';
      }
    } else {
      statusDiv.innerHTML = '<span class="status-off">desconectado</span>';
      const campaniaSection = document.getElementById('campania-section');
      if (campaniaSection) {
        campaniaSection.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Error al cargar estado:', err);
    statusDiv.innerHTML = '<span class="status-off">Estado no disponible. Reintenta más tarde.</span>';
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
      alert(data.message || 'Sesión iniciándose... Se abrirá una ventana de Chrome. Escanea el QR con WhatsApp.');
    } else {
      alert(data.message || 'No se pudo iniciar la sesión');
    }
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    alert('Error iniciando sesión. Revisa la consola del servidor.');
  }
  this.disabled = false;
  
  // Recargar estado después de 2 segundos
  setTimeout(() => {
    cargarEstadoSesion();
  }, 2000);
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
