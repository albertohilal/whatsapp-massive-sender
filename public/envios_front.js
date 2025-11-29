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

  // Al cambiar campaña, recargar lugares y tildes
  campaniaSelect.addEventListener('change', cargarLugares);

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
        await cargarLugares(); // Refrescar la tabla tras guardar
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
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.style.display = 'block';
  statusDiv.textContent = 'Cargando prospectos...';

  const campaniaId = document.getElementById('campaniaSelect')?.value || '';
  const filtroRubro = document.getElementById('filtroRubro')?.value?.toLowerCase() || '';
  const filtroDireccion = document.getElementById('filtroDireccion')?.value?.toLowerCase() || '';
  const soloValidos = document.getElementById('filtroWappValido')?.checked ? 1 : 0;
  const soloSeleccionados = document.getElementById('filtroSeleccionados')?.checked;

  try {
    let cliente_id = 51; // Cambia dinámicamente según la sesión activa
    const params = new URLSearchParams();
  if (campaniaId) params.append('campania', campaniaId);
  if (filtroRubro) params.append('rubro', filtroRubro);
  if (filtroDireccion) params.append('direccion', filtroDireccion);
  if (soloValidos) params.append('wapp_valido', soloValidos);
  params.append('cliente_id', cliente_id);
  if (soloSeleccionados) params.append('solo_seleccionados', '1');

    // 1. Obtener prospectos disponibles
    const url = `/api/envios/filtrar-prospectos?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      statusDiv.textContent = `Error del servidor (${res.status}): ${errorText}`;
      statusDiv.className = 'alert alert-danger mb-3';
      return;
    }
    const lugares = await res.json();

    // 2. Obtener prospectos ya asignados a la campaña
    let asignados = [];
    if (campaniaId) {
      const resAsignados = await fetch(`/api/envios?campania_id=${campaniaId}`);
      if (resAsignados.ok) {
        const envios = await resAsignados.json();
        // Solo agregar si existe lugar_id
        asignados = envios.filter(e => e.lugar_id !== undefined && e.lugar_id !== null).map(e => String(e.lugar_id));
      }
    }

    const tbody = document.getElementById('tablaProspectos');
    tbody.innerHTML = '';
    let lugaresFiltrados = lugares;
    if (soloSeleccionados) {
      lugaresFiltrados = lugares.filter(lugar => asignados.includes(String(lugar.id)));
    }
    statusDiv.textContent = `Cargando ${lugaresFiltrados.length} prospectos...`;

    // Si no hay seleccionados pero el filtro está activo, mostrar mensaje
    if (soloSeleccionados && lugaresFiltrados.length === 0) {
      statusDiv.textContent = 'No hay prospectos seleccionados en esta campaña.';
      statusDiv.className = 'alert alert-warning mb-3';
      return;
    }

    lugaresFiltrados.forEach((lugar) => {
      const tr = document.createElement('tr');
      // Checkbox para seleccionar
      const tdSelect = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = lugar.id;
      // Marcar con tilde si ya está asignado
      if (asignados.includes(String(lugar.id))) {
        checkbox.checked = true;
      }
      tdSelect.appendChild(checkbox);
      // Nombre
      const tdNombre = document.createElement('td');
      tdNombre.textContent = lugar.nombre;
      // Teléfono
      const tdTelefono = document.createElement('td');
      tdTelefono.textContent = lugar.telefono_wapp || 'N/A';
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

    statusDiv.textContent = `✅ ${lugares.length} prospectos cargados exitosamente`;
    statusDiv.className = 'alert alert-success mb-3';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  } catch (err) {
    statusDiv.textContent = '❌ Error al cargar prospectos: ' + err.message;
    statusDiv.className = 'alert alert-danger mb-3';
  }
}