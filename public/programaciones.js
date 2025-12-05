// programaciones.js
// Extraído de programaciones.html para cumplir CSP

const params = new URLSearchParams(window.location.search);
const state = { clienteId: null, modoAdmin: params.get('modo') === 'admin' };

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
    const res = await fetch('/api/programaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error al guardar programación');
    document.getElementById('form-programacion').reset();
    await cargarProgramaciones();
    alert('Programación enviada. El administrador la revisará pronto.');
  } catch (err) {
    alert('No se pudo guardar la programación.');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await obtenerUsuario();
  await cargarCampanias();
  await cargarProgramaciones();
  document.getElementById('form-programacion').addEventListener('submit', enviarFormulario);
});
