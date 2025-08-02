document.addEventListener('DOMContentLoaded', async () => {
  // Cargar campañas
  const campaniaSelect = document.getElementById('campaniaSelect');
  try {
    const res = await fetch('/api/campanias');
    const campanias = await res.json();
    campanias.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.nombre;
      campaniaSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Error cargando campañas:', err);
  }

  // Cargar lugares al inicio
  await cargarLugares();

  // Filtrar lugares
  document.getElementById('filtrarBtn').addEventListener('click', cargarLugares);

  // Agregar seleccionados a campaña
  document.querySelector('.btn-success').addEventListener('click', async () => {
    const campaniaId = campaniaSelect.value;
    const checkboxes = document.querySelectorAll('#tablaProspectos input[type="checkbox"]:checked');
    const lugaresSeleccionados = Array.from(checkboxes).map(cb => cb.value);

    if (!campaniaId || lugaresSeleccionados.length === 0) {
      alert('Selecciona una campaña y al menos un prospecto.');
      return;
    }

    try {
      const res = await fetch('/api/envios/agregar-a-campania', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaniaId, lugares: lugaresSeleccionados })
      });
      const data = await res.json();
      if (data.success) {
        alert('Prospectos agregados correctamente.');
      } else {
        alert('Error al agregar prospectos.');
      }
    } catch (err) {
      alert('Error de conexión.');
      console.error(err);
    }
  });
});

async function cargarLugares() {
  const filtroRubro = document.getElementById('filtroRubro')?.value?.toLowerCase() || '';
  const filtroDireccion = document.getElementById('filtroDireccion')?.value?.toLowerCase() || '';
  const soloValidos = document.getElementById('filtroWappValido')?.checked ? 1 : 0;

  try {
    // Construir la URL con los parámetros de filtro
    const params = new URLSearchParams();
    if (filtroRubro) params.append('rubro', filtroRubro);
    if (filtroDireccion) params.append('direccion', filtroDireccion);
    if (soloValidos) params.append('solo_validos', soloValidos);

    const res = await fetch(`/api/lugares?${params.toString()}`);
    const lugares = await res.json();
    const tbody = document.getElementById('tablaProspectos');
    tbody.innerHTML = '';

    lugares.forEach(lugar => {
      const tr = document.createElement('tr');

      // Checkbox para seleccionar
      const tdSelect = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = lugar.id;
      tdSelect.appendChild(checkbox);

      // Nombre
      const tdNombre = document.createElement('td');
      tdNombre.textContent = lugar.nombre;

      // Teléfono (de telefono_wapp)
      const tdTelefono = document.createElement('td');
      tdTelefono.textContent = lugar.telefono_wapp;

      // Rubro
      const tdRubro = document.createElement('td');
      tdRubro.textContent = lugar.rubro;

      // Dirección
      const tdDireccion = document.createElement('td');
      tdDireccion.textContent = lugar.direccion;

      tr.appendChild(tdSelect);
      tr.appendChild(tdNombre);
      tr.appendChild(tdTelefono);
      tr.appendChild(tdRubro);
      tr.appendChild(tdDireccion);

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error cargando lugares:', err);
  }
}