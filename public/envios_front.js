const urlParams = new URLSearchParams(window.location.search);
let clienteIdOverride = urlParams.get('cliente_id') || urlParams.get('cliente') || null;
const modoAdminParam = urlParams.get('modo') === 'admin';
const campaniaParam = urlParams.get('campania'); // Leer ID de campaña de la URL

// Variable global para almacenar todos los IDs de lugares filtrados
let todosLosLugaresFiltrados = [];

document.addEventListener('DOMContentLoaded', async () => {

  // Cargar campañas
  const campaniaSelect = document.getElementById('campaniaSelect');
  const filtroEstadoSelect = document.getElementById('filtroEstado');
  const soloSeleccionadosInput = document.getElementById('filtroSeleccionados');
  try {
    let campaniasUrl = '/api/campanias';
    if (clienteIdOverride) {
      campaniasUrl += `?cliente_id=${clienteIdOverride}`;
    }
    const res = await fetch(campaniasUrl);
    const campanias = await res.json();
    campanias.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.nombre;
      campaniaSelect.appendChild(option);
    });
    
    // Si hay parámetro campania en la URL, seleccionarla y cargar
    if (campaniaParam) {
      campaniaSelect.value = campaniaParam;
      // Cambiar a "todos" para ver todos los prospectos asignados
      if (filtroEstadoSelect) {
        filtroEstadoSelect.value = '';
      }
      // Marcar "solo seleccionados" para ver los de esta campaña
      if (soloSeleccionadosInput) {
        soloSeleccionadosInput.checked = true;
      }
    }
  } catch (err) {
    console.error('Error cargando campañas:', err);
  }

  if (filtroEstadoSelect && !filtroEstadoSelect.value && !campaniaParam) {
    filtroEstadoSelect.value = 'sin_envio';
  }

  if (soloSeleccionadosInput && filtroEstadoSelect) {
    soloSeleccionadosInput.addEventListener('change', () => {
      if (soloSeleccionadosInput.checked && filtroEstadoSelect.value === 'sin_envio') {
        filtroEstadoSelect.value = '';
      } else if (!soloSeleccionadosInput.checked && !filtroEstadoSelect.value) {
        filtroEstadoSelect.value = 'sin_envio';
      }
    });
  }

  // Cargar lugares al inicio (automáticamente si hay campaña en URL)
  if (campaniaParam) {
    await cargarLugares();
  }

  // Filtrar lugares
  document.getElementById('filtrarBtn').addEventListener('click', cargarLugares);

  // Seleccionar/Deseleccionar todos
  document.getElementById('seleccionarTodos').addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('#tablaProspectos input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
  });

  // Al cambiar campaña, recargar lugares y tildes
  campaniaSelect.addEventListener('change', cargarLugares);

  // Guardar edición de prospectos (agregar y quitar)
  const agregarBtn = document.getElementById('agregarSeleccionadosBtn');
  if (!agregarBtn) {
    console.error('No se encontró el botón para agregar seleccionados.');
    return;
  }

  agregarBtn.addEventListener('click', async () => {
    const campaniaId = campaniaSelect.value;
    const checkboxes = document.querySelectorAll('#tablaProspectos input[type="checkbox"]:checked');
    const lugaresSeleccionados = Array.from(checkboxes).map(cb => cb.value);

    console.log('🔍 DEBUG: Checkboxes marcados en DOM:', lugaresSeleccionados.length);
    console.log('🔍 DEBUG: Total lugares filtrados:', todosLosLugaresFiltrados.length);
    
    // Si el checkbox "Seleccionar todos" está marcado, usar TODOS los lugares filtrados
    const seleccionarTodosCheckbox = document.getElementById('seleccionarTodos');
    let lugaresAUsar = lugaresSeleccionados;
    
    if (seleccionarTodosCheckbox && seleccionarTodosCheckbox.checked) {
      lugaresAUsar = todosLosLugaresFiltrados.map(l => String(l.id));
      console.log('✅ Usando TODOS los lugares filtrados:', lugaresAUsar.length);
    }

    // Obtener los lugares ya asignados a la campaña
    let asignados = [];
    if (campaniaId) {
      const resAsignados = await fetch(`/api/envios?campania_id=${campaniaId}`);
      if (resAsignados.ok) {
        const envios = await resAsignados.json();
        asignados = envios.filter(e => e.lugar_id !== undefined && e.lugar_id !== null).map(e => String(e.lugar_id));
      }
    }

    // Calcular lugares a agregar y quitar
    const agregar = lugaresAUsar.filter(id => !asignados.includes(id));
    const quitar = asignados.filter(id => !lugaresAUsar.includes(id));

    console.log('📊 Agregar:', agregar.length, 'Quitar:', quitar.length);

    if (!campaniaId || (agregar.length === 0 && quitar.length === 0)) {
      alert('Selecciona una campaña y modifica la selección para guardar cambios.');
      return;
    }

    let ok = true;
    let msg = '';
    // Agregar nuevos seleccionados
    if (agregar.length > 0) {
      try {
        const res = await fetch('/api/envios/agregar-a-campania', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaniaId, lugares: agregar })
        });
        const data = await res.json();
        if (!data.success) {
          ok = false;
          msg += 'Error al agregar prospectos. ';
        }
      } catch (err) {
        ok = false;
        msg += 'Error de conexión al agregar. ';
      }
    }
    // Quitar prospectos desasignados
    if (quitar.length > 0) {
      try {
        const res = await fetch('/api/envios/quitar-de-campania', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaniaId, lugares: quitar })
        });
        const data = await res.json();
        if (!data.success) {
          ok = false;
          msg += 'Error al quitar prospectos. ';
        }
      } catch (err) {
        ok = false;
        msg += 'Error de conexión al quitar. ';
      }
    }
    if (ok) {
      alert('Cambios guardados correctamente.');
      // Forzar recarga completa para actualizar los tildes
      await cargarLugares();
      // Recargar una segunda vez para asegurar que se actualicen los estados
      setTimeout(() => cargarLugares(), 500);
    } else {
      alert(msg || 'Error al guardar cambios.');
    }
  });
});

async function cargarLugares() {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.style.display = 'none';
  statusDiv.style.display = 'block';
  statusDiv.textContent = 'Cargando prospectos...';

  const campaniaId = document.getElementById('campaniaSelect')?.value || '';
  const filtroRubro = document.getElementById('filtroRubro')?.value?.toLowerCase() || '';
  const filtroAreaSelect = document.getElementById('filtroArea');
  const filtroDireccion = document.getElementById('filtroDireccion')?.value?.toLowerCase() || '';
  const soloValidos = document.getElementById('filtroWappValido')?.checked ? 1 : 0;
  const soloSeleccionados = document.getElementById('filtroSeleccionados')?.checked;
  const filtroEstado = document.getElementById('filtroEstado')?.value || '';

    const filtroTipoCliente = document.getElementById('filtroTipoCliente')?.value || '';
  // Cargar áreas dinámicas si aún no se cargaron
  try {
    const areaSelectHasOnlyDefault = filtroAreaSelect && filtroAreaSelect.options && filtroAreaSelect.options.length <= 1;
    if (areaSelectHasOnlyDefault) {
      const { cliente_id: cid } = await obtenerUsuarioCliente();
      let asignadas = [];
      if (cid) {
        try {
          const resAsig = await fetch(`/api/clientes/${encodeURIComponent(cid)}/areas-asignadas`);
          if (resAsig.ok) {
            const dataAsig = await resAsig.json();
            asignadas = Array.isArray(dataAsig.areas) ? dataAsig.areas : [];
          }
        } catch {}
      }
      // Si hay áreas asignadas, usarlas; si no, descubrir áreas disponibles
      let areasParaMostrar = asignadas;
      if (!areasParaMostrar || areasParaMostrar.length === 0) {
        const query = cid ? `?cliente_id=${encodeURIComponent(cid)}` : '';
        const resAreas = await fetch(`/api/envios/areas${query}`);
        if (resAreas.ok) {
          const dataAreas = await resAreas.json();
          areasParaMostrar = Array.isArray(dataAreas.areas) ? dataAreas.areas : [];
        }
      }
      areasParaMostrar.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        filtroAreaSelect.appendChild(opt);
      });
      // Si solo hay una área, seleccionar y deshabilitar el dropdown para UX
      if (areasParaMostrar.length === 1) {
        filtroAreaSelect.value = areasParaMostrar[0];
        filtroAreaSelect.disabled = true;
      } else {
        filtroAreaSelect.disabled = false;
      }
    }
  } catch {}

  // Resolver filtros de área y rubro: área del select tiene prioridad
  let areaFiltro = filtroAreaSelect?.value || '';
  let rubroFiltro = filtroRubro;
  if (!areaFiltro && filtroRubro) {
    // Si escribieron un área existente en el input, tomarla como área
    const opciones = Array.from(filtroAreaSelect?.options || []).map(o => (o.value || '').toLowerCase());
    if (opciones.includes(filtroRubro)) {
      areaFiltro = (filtroRubro || '').toLowerCase();
      // Encontrar el case original para enviar
      const original = Array.from(filtroAreaSelect.options).find(o => (o.value || '').toLowerCase() === areaFiltro);
      areaFiltro = original ? original.value : areaFiltro;
      rubroFiltro = '';
      if (filtroAreaSelect) filtroAreaSelect.value = areaFiltro;
    }
  }

  try {
    let { cliente_id, tipo } = await obtenerUsuarioCliente();

    // Si es admin, permitir seleccionar cliente (por selector)
    if (clienteIdOverride) {
      cliente_id = clienteIdOverride;
    }

    if (tipo === 'admin') {
      const selector = document.getElementById('selectorCliente');
      if (selector && selector.value) {
        cliente_id = selector.value;
      } else if (clienteIdOverride) {
        cliente_id = clienteIdOverride;
      }
    }

    const params = new URLSearchParams();
    if (campaniaId) params.append('campania', campaniaId);
    if (areaFiltro) {
      params.append('area', areaFiltro);
    } else if (rubroFiltro) {
      params.append('rubro', rubroFiltro);
    }
    if (filtroDireccion) params.append('direccion', filtroDireccion);
    if (soloValidos) params.append('wapp_valido', soloValidos);
    if (cliente_id) params.append('cliente_id', cliente_id);
    if (soloSeleccionados) params.append('solo_seleccionados', '1');
    if (filtroEstado) params.append('estado', filtroEstado);
    if (filtroTipoCliente) params.append('tipo_cliente', filtroTipoCliente);
    // Debug: mostrar parámetros enviados
    console.log('🔍 Parámetros enviados al backend:', {
      campaniaId,
      filtroRubro,
      filtroDireccion,
      soloValidos,
      cliente_id,
      soloSeleccionados,
      filtroEstado,
      url_completa: `/api/envios/filtrar-prospectos?${params.toString()}`
    });

    // 1. Obtener prospectos disponibles
    const url = `/api/envios/filtrar-prospectos?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      statusDiv.textContent = `Error del servidor (${res.status}): ${errorText}`;
      statusDiv.className = 'alert alert-danger mb-3';
      return;
    }
    let lugaresResp = await res.json();
    // Compatibilidad: si la respuesta es { prospectos: [...] }, usar ese array
    const lugares = Array.isArray(lugaresResp)
      ? lugaresResp
      : (Array.isArray(lugaresResp.prospectos) ? lugaresResp.prospectos : []);

    // 2. Obtener prospectos ya asignados a la campaña con su estado
    let enviosPorLugar = new Map();
    if (campaniaId) {
      console.log('🔍 Consultando envíos para campaña:', campaniaId);
      const resAsignados = await fetch(`/api/envios/envios/campania/${campaniaId}`);
      console.log('📡 Status de respuesta:', resAsignados.status, resAsignados.ok);
      if (resAsignados.ok) {
        const envios = await resAsignados.json();
        console.log('📦 Envíos recibidos:', envios.length, 'registros');
        console.log('🔍 Primeros 3 envíos:', envios.slice(0, 3));
        // Mapear lugar_id -> estado
        envios.forEach(e => {
          if (e.lugar_id !== undefined && e.lugar_id !== null) {
            enviosPorLugar.set(String(e.lugar_id), e.estado);
          }
        });
        console.log('✅ Map de envíos construido con', enviosPorLugar.size, 'entradas');
      } else {
        const errorText = await resAsignados.text();
        console.error('❌ Error al obtener envíos:', errorText);
      }
    }

    const tbody = document.getElementById('tablaProspectos');
    tbody.innerHTML = '';
    
    // Debug: verificar duplicados
    console.log('📊 Lugares recibidos del backend:', lugares.length);
    console.log('🎯 Lugares:', lugares);
    console.log('✅ Envíos por lugar:', enviosPorLugar);
    
    let lugaresFiltrados = lugares;
    if (soloSeleccionados) {
      lugaresFiltrados = lugares.filter(lugar => enviosPorLugar.has(String(lugar.id)));
      console.log('🔍 Lugares después de filtrar por asignados:', lugaresFiltrados.length);
    }
    
    // Guardar los lugares filtrados en la variable global
    todosLosLugaresFiltrados = lugaresFiltrados;
    console.log('💾 Guardados en variable global:', todosLosLugaresFiltrados.length, 'lugares');
    
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
      
      const estadoEnvio = enviosPorLugar.get(String(lugar.id));
      
      // Si está asignado a la campaña, marcar con tilde
      if (estadoEnvio) {
        checkbox.checked = true;
        
        // Si ya fue enviado, deshabilitar el checkbox
        if (estadoEnvio === 'enviado') {
          checkbox.disabled = true;
          tr.style.backgroundColor = '#f0f9ff'; // Color azul claro para indicar enviado
        }
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
      // Ensamblar columnas en el orden del header
      tr.appendChild(tdSelect);
      tr.appendChild(tdNombre);
      tr.appendChild(tdTelefono);
      tr.appendChild(tdRubro);
      tr.appendChild(tdDireccion);
      tbody.appendChild(tr);
    });

    statusDiv.textContent = `✅ ${lugaresFiltrados.length} prospectos cargados exitosamente`;
    statusDiv.className = 'alert alert-success mb-3';
  } catch (err) {
    statusDiv.textContent = '❌ Error al cargar prospectos: ' + err.message;
    statusDiv.className = 'alert alert-danger mb-3';
  }
}

async function obtenerUsuarioCliente() {
  // Obtener datos de usuario logueado (cache simple en variable global si se quiere optimizar)
  let cliente_id = null;
  let tipo = null;
  try {
    const res = await fetch('/api/usuario-logueado');
    const data = await res.json();
    if (data && data.usuario) {
      tipo = data.tipo;
      cliente_id = data.cliente_id;
    }
  } catch {}
  return { cliente_id, tipo };
}
