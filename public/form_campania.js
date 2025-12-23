// form_campania.js
// Extraído de form_campania.html para cumplir CSP

const CLIENTE_HABY = 51;
const urlParams = new URLSearchParams(window.location.search);
const sessionOverride = urlParams.get('session') || urlParams.get('sessionName');
document.addEventListener('DOMContentLoaded', () => {
  if (sessionOverride === 'habysupply') {
    const volver = document.getElementById('volver-inicio');
    if (volver) volver.href = '/habysupply/dashboard.html';
  }
});

async function cargarSesiones() {
  // Cargar sesiones activas para el selector
  const res = await fetch('/api/sesiones');
  const data = await res.json();
  const select = document.getElementById('sessionName');
  select.innerHTML = data.map(s => `<option value="${s.session}">${s.session} (${s.activo ? 'Activo' : 'Inactivo'})</option>`).join('');
  if (sessionOverride) {
    if (![...select.options].some(opt => opt.value === sessionOverride)) {
      select.insertAdjacentHTML('beforeend', `<option value="${sessionOverride}">${sessionOverride}</option>`);
    }
    select.value = sessionOverride;
    document.getElementById('session-field').style.display = 'none';
  }
}

async function cargarCampanias() {
  try {
    const res = await fetch(`/api/campanias?cliente_id=${CLIENTE_HABY}`);
    const data = await res.json();
    const tbody = document.getElementById('campanias-table-body');
    tbody.innerHTML = '';

    data.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${c.nombre}</td>
        <td>${c.mensaje}</td>
        <td>${c.estado}</td>
        <td>
          ${c.estado === 'pendiente'
            ? `<button type="button" class="btn btn-sm btn-info js-editar" data-id="${c.id}">Editar</button>\n` +
              `<button type="button" class="btn btn-sm btn-danger js-eliminar" data-id="${c.id}">Eliminar</button>`
            : '<span class="text-muted">No editable</span>'}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error al cargar campañas:', err);
  }
}

async function editarCampania(id) {
  try {
    const res = await fetch(`/api/campanias/${id}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'No se pudo cargar la campaña');
    }
    document.getElementById('campania-id').value = data.id;
    document.getElementById('nombre').value = data.nombre;
    document.getElementById('mensaje').value = data.mensaje;
    document.getElementById('estado').value = data.estado;
  } catch (err) {
    alert(err.message || 'Error al cargar campaña');
  }
}

async function eliminarCampania(id) {
  if (!confirm('¿Eliminar esta campaña?')) return;
  try {
    const res = await fetch(`/api/campanias/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'No se pudo eliminar la campaña');
    }
    await cargarCampanias();
    resetForm();
  } catch (err) {
    alert(err.message || 'Error al eliminar campaña');
  }
}

async function guardarCampania(e) {
  e.preventDefault();
  const id = document.getElementById('campania-id').value;
  const nombre = document.getElementById('nombre').value.trim();
  const mensaje = document.getElementById('mensaje').value.trim();
  const estado = document.getElementById('estado').value;
  const sessionName = sessionOverride || document.getElementById('sessionName').value;

  if (!nombre || !mensaje || !sessionName) {
    alert('Todos los campos son obligatorios.');
    return;
  }

  const data = { nombre, mensaje, estado, sessionName, cliente_id: CLIENTE_HABY };
  const url = id ? `/api/campanias/${id}` : '/api/campanias';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const respuesta = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(respuesta.error || 'No se pudo guardar la campaña');
    }

    resetForm();
    await cargarCampanias();
  } catch (err) {
    alert(err.message || 'Error al guardar campaña');
  }
}

function resetForm() {
  const form = document.getElementById('form-campania');
  if (form) form.reset();
  const idInput = document.getElementById('campania-id');
  if (idInput) idInput.value = '';
}

// Asegurar limpieza del id también cuando se use el botón reset
document.getElementById('form-campania').addEventListener('reset', () => {
  const idInput = document.getElementById('campania-id');
  if (idInput) idInput.value = '';
});

document.getElementById('form-campania').addEventListener('submit', guardarCampania);
document.addEventListener('DOMContentLoaded', () => {
  cargarSesiones();
  cargarCampanias();
  // Delegación de eventos para acciones de la tabla
  const tbody = document.getElementById('campanias-table-body');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.classList.contains('js-editar')) {
        const id = target.getAttribute('data-id');
        if (id) editarCampania(Number(id));
      } else if (target.classList.contains('js-eliminar')) {
        const id = target.getAttribute('data-id');
        if (id) eliminarCampania(Number(id));
      }
    });
  }
});

window.editarCampania = editarCampania;
window.eliminarCampania = eliminarCampania;
window.resetForm = resetForm;
