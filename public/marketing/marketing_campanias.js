// marketing_campanias.js
// Extraído de marketing/campanias.html para cumplir CSP

const params = new URLSearchParams(window.location.search);
const modoAdmin = params.get('modo') === 'admin';
const clienteIdOverride = params.get('cliente_id') || params.get('cliente');

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

document.addEventListener('DOMContentLoaded', () => {
  mostrarUsuario();
  cargarCampanias();
});

async function cargarCampanias() {
  try {
    let url = '/marketing/campanias';
    if (modoAdmin && clienteIdOverride) {
      url += `?cliente_id=${clienteIdOverride}`;
    }
    const res = await fetch(url);
    const campanias = await res.json();
    const cont = document.getElementById('campanias-list');
    if (!Array.isArray(campanias) || campanias.length === 0) {
      cont.innerHTML = '<p>No hay campañas registradas.</p>';
    } else {
      cont.innerHTML = campanias.map(c => `<div><strong>${c.nombre}</strong> - Estado: ${c.estado}</div>`).join('');
    }
  } catch (err) {
    document.getElementById('campanias-list').innerHTML = '<p>Error al cargar campañas.</p>';
  }
}
