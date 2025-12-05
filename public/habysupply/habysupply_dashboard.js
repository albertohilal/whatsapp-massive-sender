// habysupply_dashboard.js
// Extraído de dashboard.html para cumplir CSP

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const modoAdmin = params.get('modo') === 'admin';
  const clienteId = params.get('cliente');
  const btnVerCampanias = document.querySelector('a.btn-link[href="/habysupply/campanias.html"]');
  if (btnVerCampanias && modoAdmin && clienteId) {
    btnVerCampanias.href = `/habysupply/campanias.html?modo=admin&cliente_id=${clienteId}`;
  }
});

async function mostrarUsuario() {
  try {
    const res = await fetch('/api/usuario-logueado');
    const data = await res.json();
    if (data && data.usuario) {
      document.getElementById('usuario-logueado').textContent = `Usuario: ${data.usuario}`;
    }
  } catch (err) {
    document.getElementById('usuario-logueado').textContent = '';
  }
}
mostrarUsuario();

async function cargarCampanias() {
  // Solo valida estado para permitir acceso al resto de acciones
  try {
    const res = await fetch('/habysupply/campanias');
    await res.json();
  } catch (err) {
    // No necesitamos mostrar aquí las campañas ni destinatarios
  }
}

async function cargarEstadoSesion() {
  const statusDiv = document.getElementById('wapp-session-status');
  statusDiv.textContent = 'Consultando estado...';
  try {
    const res = await fetch('/habysupply/api/wapp-session');
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
    const res = await fetch('/habysupply/api/wapp-session/init', { method: 'POST' });
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
    const res = await fetch('/habysupply/api/wapp-session/close', { method: 'POST' });
    const data = await res.json();
    alert(data.message || (data.success ? 'Sesión cerrada.' : 'No se pudo cerrar'));
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    alert('Error cerrando sesión.');
  }
  this.disabled = false;
  cargarEstadoSesion();
});

window.addEventListener('DOMContentLoaded', () => {
  cargarCampanias();
  cargarEstadoSesion();
});
