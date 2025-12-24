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
        <div style="margin-top:10px;display:flex;gap:8px;">
          <button class="btn-secondary" onclick="editarProgramacion(${p.id})">Editar</button>
          <button class="btn-danger" onclick="eliminarProgramacion(${p.id})">Eliminar</button>
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

window.editarProgramacion = async function(id) {
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
};

window.eliminarProgramacion = async function(id) {
  if (!confirm('¿Estás seguro de eliminar esta programación?')) return;
  
  try {
    const res = await fetch(`/api/programaciones/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar');
    
    await cargarProgramaciones();
    alert('Programación eliminada correctamente');
  } catch (err) {
    alert('No se pudo eliminar la programación');
  }
};

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
  document.getElementById('form-programacion').addEventListener('submit', enviarFormulario);
});
