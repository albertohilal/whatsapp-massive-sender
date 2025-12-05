// campanias_haby.js
// Extraído de public/haby/campanias.html

const params = new URLSearchParams(window.location.search);
let clienteId = params.get('cliente_id') || params.get('cliente') || null;

async function obtenerClienteIdSesion() {
  if (clienteId) return clienteId;
  try {
    const res = await fetch('/api/usuario-logueado');
    const data = await res.json();
    if (data?.cliente_id) {
      clienteId = data.cliente_id;
    }
  } catch (err) {
    console.error('No se pudo obtener el cliente de la sesión', err);
  }
  return clienteId;
}

function actualizarInfoCliente() {
  const info = document.getElementById('info-cliente');
  if (clienteId) {
    info.textContent = `Cliente ID: ${clienteId}`;
  } else {
    info.textContent = 'Cliente no identificado.';
  }
}

// Cargar campañas del cliente
async function cargarCampanias() {
  await obtenerClienteIdSesion();
  actualizarInfoCliente();
  try {
    const queryParam = clienteId ? `?cliente_id=${clienteId}` : '';
    const res = await fetch(`/api/campanias${queryParam}`);
    const data = await res.json();
    const cont = document.getElementById('campanias-lista');
    if (Array.isArray(data) && data.length > 0) {
      cont.innerHTML = '<ul>' + data.map(c => `<li><strong>${c.nombre}</strong>: ${c.mensaje} <em>(${c.estado})</em></li>`).join('') + '</ul>';
    } else {
      cont.textContent = 'No hay campañas para este cliente.';
    }
  } catch (err) {
    document.getElementById('campanias-lista').textContent = 'Error cargando campañas.';
  }
}

document.addEventListener('DOMContentLoaded', cargarCampanias);
