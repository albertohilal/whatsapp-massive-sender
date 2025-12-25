// programaciones.js
// Extraído de programaciones.html para cumplir CSP

const params = new URLSearchParams(window.location.search);
const state = { 
  clienteId: null, 
  modoAdmin: params.get('modo') === 'admin',
  programacionEditando: null // ID de la programación en edición
};

async function obtenerUsuario() {
  try {
    const res = await fetch('/api/usuario-logueado');
    const data = await res.json();
    if (data && data.usuario) {
      document.getElementById('usuario-logueado').textContent = `Usuario: ${data.usuario}`;
      if (state.modoAdmin) {
        state.clienteId = params.get('cliente_id');
      } else {
        state.clienteId = data.cliente_id;
      }
    }
  } catch (err) {
    document.getElementById('usuario-logueado').textContent = '';
  }
}

async function cargarCampanias() {
  const select = document.getElementById('campania-id');
  select.innerHTML = '';
  let url = '/api/campanias';
  if (state.clienteId) {
    url += `?cliente_id=${state.clienteId}`;
  }
  const res = await fetch(url);
  const campanias = await res.json();
  if (!Array.isArray(campanias) || !campanias.length) {
    select.innerHTML = '<option value="">No hay campañas</option>';
    return;
  }
  select.innerHTML = campanias
    .map((c) => `<option value="${c.id}">${c.nombre}</option>`)
    .join('');
}

function diasSeleccionados() {
  return Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map((cb) => cb.value);
}

async function cargarProgramaciones() {
  const cont = document.getElementById('lista-programaciones');
  cont.textContent = 'Cargando...';
  let url = '/api/programaciones';
  if (state.modoAdmin && state.clienteId) {
    url += `?cliente_id=${state.clienteId}`;
  }
  const res = await fetch(url);
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) {
    cont.innerHTML = '<p class="muted">Todavía no registraste programaciones.</p>';
    return;
  }
  cont.innerHTML = data
    .map((p) => `
      <div class="program-card">
        <div style="font-weight:600">${p.campania_nombre || 'Campaña ' + p.campania_id}</div>
        <div class="muted">Días: ${p.dias_semana.toUpperCase()}</div>
        <div class="muted">Horario: ${p.hora_inicio} - ${p.hora_fin}</div>
        <div class="muted">Cupo diario: ${p.cupo_diario}</div>
        <div class="muted">Estado: <span class="badge estado-${p.estado}">${p.estado}</span></div>
        ${p.comentario_admin ? `<div class="muted">Admin: ${p.comentario_admin}</div>` : ''}
        ${p.rechazo_motivo ? `<div class="muted" style="color:#dc2626;">Motivo rechazo: ${p.rechazo_motivo}</div>` : ''}
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          ${state.modoAdmin && p.estado === 'pendiente' ? `
            <button class="btn-aprobar" data-id="${p.id}" style="background:#10b981;color:white;padding:8px 16px;border:none;border-radius:5px;cursor:pointer;font-weight:600;">✅ Aprobar</button>
            <button class="btn-rechazar" data-id="${p.id}" style="background:#ef4444;color:white;padding:8px 16px;border:none;border-radius:5px;cursor:pointer;">❌ Rechazar</button>
          ` : ''}
          <button class="btn-secondary btn-editar" data-id="${p.id}">Editar</button>
          <button class="btn-danger btn-eliminar" data-id="${p.id}">Eliminar</button>
        </div>
      </div>
    `)
    .join('');
}

async function enviarFormulario(e) {
  e.preventDefault();
  const payload = {
    campania_id: document.getElementById('campania-id').value,
    dias_semana: diasSeleccionados(),
    hora_inicio: document.getElementById('hora-inicio').value,
    hora_fin: document.getElementById('hora-fin').value,
    cupo_diario: Number(document.getElementById('cupo-diario').value),
    fecha_inicio: document.getElementById('fecha-inicio').value,
    fecha_fin: document.getElementById('fecha-fin').value || null,
    comentario: document.getElementById('comentario').value || null
  };
  if (state.modoAdmin && state.clienteId) {
    payload.cliente_id = state.clienteId;
  }
  try {
    const method = state.programacionEditando ? 'PUT' : 'POST';
    const url = state.programacionEditando 
      ? `/api/programaciones/${state.programacionEditando}` 
      : '/api/programaciones';
    
    const esEdicion = state.programacionEditando !== null;
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error al guardar programación');
    
    document.getElementById('form-programacion').reset();
    state.programacionEditando = null;
    document.getElementById('btn-cancelar-edicion').style.display = 'none';
    document.querySelector('button[type="submit"]').textContent = 'Enviar solicitud';
    
    await cargarProgramaciones();
    alert(esEdicion ? 'Programación actualizada correctamente.' : 'Programación enviada. El administrador la revisará pronto.');
  } catch (err) {
    alert('No se pudo guardar la programación.');
  }
}

async function editarProgramacion(id) {
  try {
    let url = '/api/programaciones';
    if (state.modoAdmin && state.clienteId) {
      url += `?cliente_id=${state.clienteId}`;
    }
    const res = await fetch(url);
    const programaciones = await res.json();
    const prog = programaciones.find(p => p.id === id);
    
    if (!prog) {
      alert('Programación no encontrada');
      return;
    }
    
    // Llenar formulario
    state.programacionEditando = id;
    document.getElementById('campania-id').value = prog.campania_id;
    document.getElementById('hora-inicio').value = prog.hora_inicio;
    document.getElementById('hora-fin').value = prog.hora_fin;
    document.getElementById('cupo-diario').value = prog.cupo_diario;
    document.getElementById('fecha-inicio').value = prog.fecha_inicio;
    document.getElementById('fecha-fin').value = prog.fecha_fin || '';
    document.getElementById('comentario').value = prog.comentario || '';
    
    // Marcar días de la semana
    const dias = prog.dias_semana.toLowerCase().split(',');
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = dias.includes(cb.value);
    });
    
    // Cambiar texto del botón y mostrar botón cancelar
    document.querySelector('button[type="submit"]').textContent = 'Actualizar programación';
    document.getElementById('btn-cancelar-edicion').style.display = 'inline-block';
    
    // Scroll al formulario
    document.getElementById('form-programacion').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('Error al cargar datos de programación');
  }
}

async function eliminarProgramacion(id) {
  if (!confirm('¿Estás seguro de eliminar esta programación?')) return;
  
  try {
    const res = await fetch(`/api/programaciones/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar');
    
    await cargarProgramaciones();
    alert('Programación eliminada correctamente');
  } catch (err) {
    alert('No se pudo eliminar la programación');
  }
}

async function aprobarProgramacion(id) {
  const comentario = prompt('Comentario de aprobación (opcional):');
  if (comentario === null) return; // Usuario canceló
  
  try {
    const res = await fetch(`/api/programaciones/${id}/aprobar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comentario_admin: comentario || null })
    });
    
    if (!res.ok) throw new Error('Error al aprobar');
    
    await cargarProgramaciones();
    alert('✅ Programación aprobada. Los envíos comenzarán automáticamente en el horario configurado.');
  } catch (err) {
    alert('No se pudo aprobar la programación');
  }
}

async function rechazarProgramacion(id) {
  const motivo = prompt('Motivo del rechazo:');
  if (!motivo || motivo.trim() === '') {
    alert('Debes indicar un motivo de rechazo');
    return;
  }
  
  try {
    const res = await fetch(`/api/programaciones/${id}/rechazar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rechazo_motivo: motivo })
    });
    
    if (!res.ok) throw new Error('Error al rechazar');
    
    await cargarProgramaciones();
    alert('❌ Programación rechazada');
  } catch (err) {
    alert('No se pudo rechazar la programación');
  }
}

function cancelarEdicion() {
  state.programacionEditando = null;
  document.getElementById('form-programacion').reset();
  document.querySelector('button[type="submit"]').textContent = 'Enviar solicitud';
  document.getElementById('btn-cancelar-edicion').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', async () => {
  await obtenerUsuario();
  await cargarCampanias();
  await cargarProgramaciones();
  
  // Event listener para el formulario
  document.getElementById('form-programacion').addEventListener('submit', enviarFormulario);
  
  // Event listener para cancelar edición
  document.getElementById('btn-cancelar-edicion').addEventListener('click', cancelarEdicion);
  
  // Event delegation para botones Editar y Eliminar
  document.getElementById('lista-programaciones').addEventListener('click', (e) => {
    const target = e.target;
    
    if (target.classList.contains('btn-editar')) {
      const id = Number(target.dataset.id);
      editarProgramacion(id);
    }
    
    if (target.classList.contains('btn-eliminar')) {
      const id = Number(target.dataset.id);
      eliminarProgramacion(id);
    }
    
    if (target.classList.contains('btn-aprobar')) {
      const id = Number(target.dataset.id);
      aprobarProgramacion(id);
    }
    
    if (target.classList.contains('btn-rechazar')) {
      const id = Number(target.dataset.id);
      rechazarProgramacion(id);
    }
  });
});
