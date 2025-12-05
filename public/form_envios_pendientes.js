// form_envios_pendientes.js
// Extraído de form_envios_pendientes.html para cumplir CSP

let pendientes = [];

async function cargarCampanias() {
  try {
    const res = await fetch('/api/campanias');
    const campanias = await res.json();
    const select = document.getElementById('select-campania');

    select.innerHTML = campanias.map(c => 
      `<option value="${c.id}">${c.id} - ${c.nombre}</option>`
    ).join('');

    select.addEventListener('change', cargarPendientes);
    cargarPendientes(); // Carga inicial
  } catch (error) {
    console.error('Error al cargar campañas:', error);
    alert('Error al cargar campañas.');
  }
}

async function cargarPendientes() {
  const campania_id = document.getElementById('select-campania').value;
  if (!campania_id) return;

  try {
    const res = await fetch(`/api/envios?campania_id=${campania_id}`);
    pendientes = await res.json();
    renderizarPendientes();
  } catch (error) {
    console.error('Error al cargar pendientes:', error);
    alert('Error al cargar mensajes pendientes.');
  }
}

function renderizarPendientes() {
  const contenedor = document.getElementById('tabla-pendientes');

  if (!Array.isArray(pendientes) || pendientes.length === 0) {
    contenedor.innerHTML = '<p class="text-muted">No hay mensajes pendientes.</p>';
    return;
  }

  const tabla = `
    <table class="table table-bordered table-striped">
      <thead class="table-light">
        <tr>
          <th></th>
          <th>ID</th>
          <th>Teléfono</th>
          <th>Mensaje</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${pendientes.map(p => `
          <tr>
            <td><input type="checkbox" data-id="${p.id}" checked></td>
            <td>${p.id}</td>
            <td>${p.telefono_wapp}</td>
            <td>${p.mensaje_final}</td>
            <td>${p.estado}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  contenedor.innerHTML = tabla;
}

async function enviarSeleccionados() {
  const seleccionados = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => parseInt(cb.getAttribute('data-id')))
    .filter(id => !isNaN(id));

  if (seleccionados.length === 0) {
    alert('Seleccioná al menos un mensaje.');
    return;
  }

  const confirmar = confirm(`¿Seguro que querés enviar ${seleccionados.length} mensaje(s) ahora?`);
  if (!confirmar) return;

  try {
    const res = await fetch('/api/enviar-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: seleccionados })
    });

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Respuesta no es JSON');
    }

    const data = await res.json();

    if (res.ok) {
      alert(data.mensaje || 'Mensajes enviados con éxito.');
      cargarPendientes();
    } else {
      alert(data.error || 'Error al enviar mensajes.');
    }
  } catch (error) {
    console.error('Error al enviar mensajes:', error);
    alert('No se pudo conectar con el servidor.');
  }
}

document.addEventListener('DOMContentLoaded', cargarCampanias);
window.enviarSeleccionados = enviarSeleccionados;
