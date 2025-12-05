// habysupply_admin.js
// Extraído de public/habysupply/admin.html

document.addEventListener('DOMContentLoaded', () => {
  cargarCampaniasPendientes();
});

async function cargarCampaniasPendientes() {
  const cont = document.getElementById('admin-campanias-list');
  cont.innerHTML = '<div>Cargando campañas...</div>';
  try {
    const res = await fetch('/admin/campanias?estado=pendiente');
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      cont.innerHTML = data.map(c => `
        <div style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07);padding:18px 22px;min-width:220px;max-width:320px;margin-bottom:18px;">
          <div style="font-weight:500;font-size:1.1rem;">${c.nombre}</div>
          <div style="margin:8px 0 12px 0;color:#555;">${c.mensaje}</div>
          <div style="font-size:0.95rem;"><b>Cliente:</b> ${c.cliente_nombre || c.cliente_id}</div>
          <div style="margin-top:10px;">
            <button class="button btn-aprobar" data-id="${c.id}">Aprobar</button>
            <button class="button btn-enviar" style="background:#46b450;margin-left:10px;" data-id="${c.id}">Enviar</button>
          </div>
        </div>
      `).join('');
      // Delegar eventos
      cont.querySelectorAll('.btn-aprobar').forEach(btn => {
        btn.addEventListener('click', () => aprobarCampania(btn.dataset.id));
      });
      cont.querySelectorAll('.btn-enviar').forEach(btn => {
        btn.addEventListener('click', () => enviarCampania(btn.dataset.id));
      });
    } else {
      cont.innerHTML = '<div>No hay campañas pendientes.</div>';
    }
  } catch (err) {
    cont.innerHTML = '<div class="error-message">Error cargando campañas.</div>';
  }
}

async function aprobarCampania(id) {
  if (!confirm('¿Aprobar esta campaña?')) return;
  try {
    const res = await fetch(`/admin/campanias/${id}/aprobar`, { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Campaña aprobada.');
      cargarCampaniasPendientes();
    } else {
      alert('Error al aprobar campaña.');
    }
  } catch {
    alert('Error de red.');
  }
}

async function enviarCampania(id) {
  if (!confirm('¿Enviar esta campaña ahora?')) return;
  try {
    const res = await fetch(`/admin/campanias/${id}/enviar`, { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('Campaña enviada.');
      cargarCampaniasPendientes();
    } else {
      alert('Error al enviar campaña.');
    }
  } catch {
    alert('Error de red.');
  }
}
