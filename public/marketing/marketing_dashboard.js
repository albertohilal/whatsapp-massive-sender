// marketing_dashboard.js
// Extraído de marketing/dashboard.html para cumplir CSP

const params = new URLSearchParams(window.location.search);
const CLIENTE_NOMBRE = 'Marketing';
const modoAdmin = params.get('modo') === 'admin';
const clienteIdParam = params.get('cliente_id') || params.get('cliente');
const btnVerCampanias = document.querySelector('a.btn-link[href="/marketing/campanias.html"]');
const btnProspectos = document.getElementById('btn-prospectos');
const btnProgramaciones = document.getElementById('btn-programaciones');

document.addEventListener('DOMContentLoaded', () => {
  if (btnVerCampanias && modoAdmin && clienteIdParam) {
    btnVerCampanias.href = `/marketing/campanias.html?modo=admin&cliente_id=${clienteIdParam}`;
  }
  if (btnProspectos && modoAdmin && clienteIdParam) {
    btnProspectos.href = `/form_envios.html?session=marketing&modo=admin&cliente_id=${clienteIdParam}&cliente_nombre=${encodeURIComponent(CLIENTE_NOMBRE)}`;
  }
  if (btnProgramaciones && modoAdmin && clienteIdParam) {
    btnProgramaciones.href = `/programaciones.html?modo=admin&cliente_id=${clienteIdParam}`;
  }
  mostrarUsuario();
  cargarCampanias();
  cargarEstadoSesion();
  cargarEstadoResponder();
  inicializarResponderToggle();
});

async function mostrarUsuario() {
  try {
    const res = await fetch('/api/usuario-logueado');
    const data = await res.json();
    if (data && data.usuario) {
      document.getElementById('usuario-logueado').textContent = `Usuario: ${data.usuario}`;
      if (!modoAdmin && data.cliente_id) {
        if (btnVerCampanias) {
          btnVerCampanias.href = `/marketing/campanias.html?cliente_id=${data.cliente_id}`;
        }
        if (btnProspectos) {
          btnProspectos.href = `/form_envios.html?session=marketing&cliente_id=${data.cliente_id}&cliente_nombre=${encodeURIComponent(CLIENTE_NOMBRE)}`;
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

async function cargarCampanias() {
  try {
    const res = await fetch('/marketing/campanias');
    await res.json();
  } catch (err) {}
}

async function cargarEstadoSesion() {
  const statusDiv = document.getElementById('wapp-session-status');
  statusDiv.textContent = 'Consultando estado...';
  try {
    const res = await fetch('/marketing/api/wapp-session');
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
    const res = await fetch('/marketing/api/wapp-session/init', { method: 'POST' });
    const data = await res.json();
    alert(data.message || (data.success ? 'Sesión iniciándose...' : 'No se pudo iniciar'));
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    alert('Error iniciando sesión.');
  }
  this.disabled = false;
  cargarEstadoSesion();
});

document.getElementById('wapp-session-close').addEventListener('click', async function() {
  this.disabled = true;
  try {
    const res = await fetch('/marketing/api/wapp-session/close', { method: 'POST' });
    const data = await res.json();
    alert(data.message || (data.success ? 'Sesión cerrada.' : 'No se pudo cerrar'));
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    alert('Error cerrando sesión.');
  }
  this.disabled = false;
  cargarEstadoSesion();
});

function inicializarResponderToggle() {
  const btn = document.getElementById('responder-toggle');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    const estadoActual = btn.dataset.estado === 'activo';
    try {
      const res = await fetch('/api/bot-responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !estadoActual })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'No se pudo actualizar');
      }
      actualizarUIResponder(data.estado.responder_activo);
    } catch (err) {
      alert(`Error actualizando respuestas: ${err.message}`);
    } finally {
      btn.disabled = false;
    }
  });
}

async function cargarEstadoResponder() {
  const status = document.getElementById('responder-status');
  if (!status) return;
  status.textContent = 'Consultando estado...';
  try {
    const res = await fetch('/api/bot-responder');
    if (!res.ok) throw new Error('No se pudo consultar');
    const data = await res.json();
    actualizarUIResponder(data.responder_activo);
  } catch (err) {
    console.error('Error consultando estado de respuestas:', err);
    status.textContent = 'Estado no disponible';
  }
}

function actualizarUIResponder(activo) {
  const status = document.getElementById('responder-status');
  const btn = document.getElementById('responder-toggle');
  if (!status || !btn) return;
  status.textContent = activo ? 'Respuestas activas' : 'Respuestas pausadas';
  status.className = `status-line ${activo ? 'status-ok' : 'status-off'}`;
  btn.textContent = activo ? 'Pausar respuestas' : 'Activar respuestas';
  btn.dataset.estado = activo ? 'activo' : 'pausado';
}
