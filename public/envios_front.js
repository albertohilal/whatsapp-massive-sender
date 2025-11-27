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
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.style.display = 'block';
  statusDiv.textContent = 'Cargando prospectos...';
  
  const campaniaId = document.getElementById('campaniaSelect')?.value || '';
  const filtroRubro = document.getElementById('filtroRubro')?.value?.toLowerCase() || '';
  const filtroDireccion = document.getElementById('filtroDireccion')?.value?.toLowerCase() || '';
  const soloValidos = document.getElementById('filtroWappValido')?.checked ? 1 : 0;

  try {
    // Determinar el cliente_id según la sesión activa
    // Ejemplo: puedes obtenerlo de una variable global, del backend, o del selector de sesión
    // Aquí lo dejamos fijo para Haby (51) y Beto (1) como ejemplo
    let cliente_id = 51; // Cambia dinámicamente según la sesión activa
    // Si tienes un selector de sesión, puedes obtener el cliente_id correspondiente

    // Construir la URL con los parámetros de filtro
    const params = new URLSearchParams();
    if (campaniaId) params.append('campania', campaniaId);
    if (filtroRubro) params.append('rubro', filtroRubro);
    if (filtroDireccion) params.append('direccion', filtroDireccion);
    if (soloValidos) params.append('wapp_valido', soloValidos);
    params.append('cliente_id', cliente_id);

    const url = `/api/envios/filtrar-prospectos?${params.toString()}`;
    console.log('🚀 Llamando a URL:', url);
    
    const res = await fetch(url);
    console.log('📡 Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Error HTTP:', res.status, errorText);
      statusDiv.textContent = `Error del servidor (${res.status}): ${errorText}`;
      statusDiv.className = 'alert alert-danger mb-3';
      return;
    }
    
    const data = await res.json();
    console.log('📦 Data recibida:', Array.isArray(data) ? `Array con ${data.length} elementos` : data);
    
    const tbody = document.getElementById('tablaProspectos');
    tbody.innerHTML = '';

    // Verificar si la respuesta es un array válido
    if (!Array.isArray(data)) {
      console.error('❌ Error: La respuesta no es un array válido:', data);
      statusDiv.textContent = 'Error: Respuesta inválida del servidor';
      statusDiv.className = 'alert alert-danger mb-3';
      if (data.error) {
        console.error('Error del servidor:', data.error);
      }
      return;
    }

    const lugares = data;
    statusDiv.textContent = `Cargando ${lugares.length} prospectos...`;
    
    lugares.forEach((lugar) => {
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
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
    
  } catch (err) {
    console.error('Error cargando lugares:', err);
    statusDiv.textContent = '❌ Error al cargar prospectos: ' + err.message;
    statusDiv.className = 'alert alert-danger mb-3';
  }
}