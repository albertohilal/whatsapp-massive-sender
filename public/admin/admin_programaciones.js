// admin_programaciones.js
// Extraído de public/admin/programaciones.html

const estadoColors = {
  pendiente: '#f97316',
  aprobada: '#16a34a',
  rechazada: '#dc2626',
  pausada: '#9333ea'
};

async function mostrarUsuario() {
  try {
    const res = await fetch('/api/usuario-logueado');
    const data = await res.json();
    if (data && data.usuario) {
      document.getElementById('usuario-logueado').textContent = `Usuario: ${data.usuario}`;
    }
  } catch {
    document.getElementById('usuario-logueado').textContent = '';
  }
}

function renderLista(elementId, programaciones, showAcciones = false) {
  const cont = document.getElementById(elementId);
  if (!Array.isArray(programaciones) || !programaciones.length) {
    cont.innerHTML = '<p class="muted">Sin registros</p>';
    return;
  }

  cont.innerHTML = programaciones
    .map((p) => `
      <div class="program-card">
        <div style="font-weight:600">${p.cliente_nombre || 'Cliente'} - ${p.campania_nombre || 'Campaña ' + p.campania_id}</div>
        <div class="muted">Días: ${p.dias_semana.toUpperCase()}</div>
        <div class="muted">Horario: ${p.hora_inicio} - ${p.hora_fin}</div>
        <div class="muted">Cupo diario: ${p.cupo_diario}</div>
        <div class="muted">Estado: <span style="color:${estadoColors[p.estado] || '#111'}">${p.estado}</span></div>
        ${p.comentario_cliente ? `<div class="muted">Cliente: ${p.comentario_cliente}</div>` : ''}
        ${p.comentario_admin ? `<div class="muted">Admin: ${p.comentario_admin}</div>` : ''}
        ${showAcciones ? `<div class="accion-buttons" data-id="${p.id}">
          <button data-accion="aprobar" class="btn-link">Aprobar</button>
          <button data-accion="rechazar" class="btn-danger">Rechazar</button>
        </div>` : `
          <div class="accion-buttons" data-id="${p.id}">
            <button data-accion="${p.estado === 'pausada' ? 'reanudar' : 'pausar'}" class="btn-secondary">
              ${p.estado === 'pausada' ? 'Reanudar' : 'Pausar'}
            </button>
          </div>
        `}
      </div>
    `)
    .join('');
}

async function cargarProgramaciones() {
  try {
    const pendientesRes = await fetch('/admin/programaciones?estado=pendiente');
    const pendientes = await pendientesRes.json();
    renderLista('programaciones-pendientes', pendientes, true);

    const activasRes = await fetch('/admin/programaciones?estado=aprobada');
    const activas = await activasRes.json();
    renderLista('programaciones-activas', activas);
  } catch (err) {
    console.error('Error cargando programaciones:', err);
  }
}

async function ejecutarAccion(id, accion) {
  let endpoint = accion;
  if (accion === 'aprobar') endpoint = 'aprobar';
  if (accion === 'rechazar') endpoint = 'rechazar';
  if (accion === 'pausar') endpoint = 'pausar';
  if (accion === 'reanudar') endpoint = 'reanudar';
  try {
    const res = await fetch(`/admin/programaciones/${id}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error('Error ejecutando acción');
    await cargarProgramaciones();
  } catch {
    alert('No se pudo completar la acción.');
  }
}

document.addEventListener('click', (e) => {
  const accion = e.target.dataset.accion;
  if (!accion) return;
  const card = e.target.closest('.accion-buttons');
  if (!card) return;
  const id = card.dataset.id;
  ejecutarAccion(id, accion);
});

document.addEventListener('DOMContentLoaded', async () => {
  await mostrarUsuario();
  await cargarProgramaciones();
});
