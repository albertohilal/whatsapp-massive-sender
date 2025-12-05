// lugares.js
// Extraído de lugares.html para cumplir CSP

let lugaresTotales = [];
let rubros = [];

async function cargarRubros() {
  const res = await fetch('/api/rubros');
  rubros = await res.json();
  const select = document.getElementById('rubro_id');
  select.innerHTML = '<option value="">Seleccione un rubro</option>';
  rubros.forEach(r => {
    const option = document.createElement('option');
    option.value = r.id;
    option.textContent = r.nombre_es || r.nombre || 'Sin nombre';
    select.appendChild(option);
  });
}

async function cargarLugares() {
  const res = await fetch('/api/lugares');
  lugaresTotales = await res.json();
  filtrarLugares();
}

function filtrarLugares() {
  const nombreFiltro = document.getElementById('filtroNombre').value.toLowerCase();
  const direccionFiltro = document.getElementById('filtroDireccion').value.toLowerCase();
  const whatsappFiltro = document.getElementById('filtroWhatsapp').value.toLowerCase();
  const rubroFiltro = document.getElementById('filtroRubro').value.toLowerCase();

  const tbody = document.querySelector('#tablaLugares tbody');
  tbody.innerHTML = '';

  lugaresTotales
    .filter(l =>
      l.nombre.toLowerCase().includes(nombreFiltro) &&
      (l.direccion || '').toLowerCase().includes(direccionFiltro) &&
      (l.telefono_wapp || '').toLowerCase().includes(whatsappFiltro) &&
      (l.rubro || '').toLowerCase().includes(rubroFiltro)
    )
    .forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${l.id}</td>
        <td>${l.nombre}</td>
        <td>${l.direccion || ''}</td>
        <td>${l.telefono_wapp || ''}</td>
        <td>${l.rubro || ''}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick='editarLugar(${JSON.stringify(l)})'>Editar</button>
          <button class="btn btn-sm btn-danger" onclick='eliminarLugar(${l.id})'>Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
}

function editarLugar(l) {
  document.getElementById('id').value = l.id;
  document.getElementById('nombre').value = l.nombre;
  document.getElementById('direccion').value = l.direccion || '';
  document.getElementById('telefono_wapp').value = l.telefono_wapp || '';
  document.getElementById('rubro_id').value = l.rubro_id || '';
  // Si tienes un campo place_id en el formulario, agrégalo aquí
  // document.getElementById('place_id').value = l.place_id || '';
  window.scrollTo(0, 0);
}

function resetForm() {
  document.getElementById('lugarForm').reset();
  document.getElementById('id').value = '';
  // Si tienes un campo place_id en el formulario, agrégalo aquí
  // document.getElementById('place_id').value = '';
}

async function eliminarLugar(id) {
  if (confirm('¿Estás seguro que querés eliminar este lugar?')) {
    await fetch(`/api/lugares/${id}`, { method: 'DELETE' });
    cargarLugares();
  }
}

document.getElementById('lugarForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    nombre: document.getElementById('nombre').value,
    direccion: document.getElementById('direccion').value,
    telefono_wapp: document.getElementById('telefono_wapp').value,
    rubro_id: document.getElementById('rubro_id').value
  };
  // Solo agrega place_id si existe y no está vacío
  // const placeIdInput = document.getElementById('place_id');
  // if (placeIdInput && placeIdInput.value) {
  //   data.place_id = placeIdInput.value;
  // }
  const id = document.getElementById('id').value;
  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/lugares/${id}` : '/api/lugares';
  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  resetForm();
  cargarLugares();
});

document.addEventListener('DOMContentLoaded', () => {
  cargarRubros();
  cargarLugares();
});

window.filtrarLugares = filtrarLugares;
window.editarLugar = editarLugar;
window.resetForm = resetForm;
window.eliminarLugar = eliminarLugar;
