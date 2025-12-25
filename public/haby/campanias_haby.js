// campanias_haby.js
// Extraído de public/haby/campanias.html

const params = new URLSearchParams(window.location.search);
let clienteId = params.get('cliente_id') || params.get('cliente') || null;

async function obtenerClienteIdSesion() {
  if (clienteId) return clienteId;
  try {
    const res = await fetch('/api/usuario-logueado');
    const data = await res.json();
    if (data?.cliente_id) {
      clienteId = data.cliente_id;
    }
  } catch (err) {
    console.error('No se pudo obtener el cliente de la sesión', err);
  }
  return clienteId;
}

function actualizarInfoCliente() {
  const info = document.getElementById('info-cliente');
  if (clienteId) {
    info.textContent = `Cliente ID: ${clienteId}`;
  } else {
    info.textContent = 'Cliente no identificado.';
  }
}

// Cargar campañas del cliente
async function cargarCampanias() {
  await obtenerClienteIdSesion();
  actualizarInfoCliente();
  try {
    const queryParam = clienteId ? `?cliente_id=${clienteId}` : '';
    const res = await fetch(`/api/campanias${queryParam}`);
    const data = await res.json();
    const cont = document.getElementById('campanias-lista');
    if (Array.isArray(data) && data.length > 0) {
      let html = '<div style="display: grid; gap: 20px;">';
      data.forEach(c => {
        html += `
          <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9;">
            <h3 style="margin: 0 0 10px 0;">${c.nombre}</h3>
            <p style="margin: 5px 0;"><strong>Mensaje:</strong> ${c.mensaje}</p>
            <p style="margin: 5px 0;"><strong>Estado:</strong> <span style="color: ${c.estado === 'pendiente' ? '#f59e0b' : '#10b981'};">${c.estado}</span></p>
            <div style="margin-top: 10px; display: flex; gap: 10px;">
              ${c.estado === 'pendiente' ? `<button class="btn-enviar" data-id="${c.id}" style="background: #10b981; color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer;">📤 Enviar Ahora</button>` : ''}
              <button class="btn-detalles" data-id="${c.id}" style="background: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer;">👁️ Ver Detalles</button>
            </div>
          </div>
        `;
      });
      html += '</div>';
      cont.innerHTML = html;
    } else {
      cont.textContent = 'No hay campañas para este cliente.';
    }
  } catch (err) {
    document.getElementById('campanias-lista').textContent = 'Error cargando campañas.';
  }
}

// Enviar campaña
async function enviarCampania(id) {
  if (!confirm('¿Confirmas que deseas enviar esta campaña ahora? Los mensajes se enviarán uno por uno.')) {
    return;
  }
  
  try {
    const res = await fetch(`/api/envios/enviar/${id}`, { method: 'POST' });
    const data = await res.json();
    
    if (data.ok) {
      alert(`✅ Campaña enviada: ${data.message}\n\nEnviados: ${data.enviados || 0}\nErrores: ${data.errores || 0}`);
      cargarCampanias(); // Recargar lista
    } else {
      alert(`❌ Error: ${data.error || 'No se pudo enviar la campaña'}`);
    }
  } catch (err) {
    console.error('Error enviando campaña:', err);
    alert('❌ Error de conexión al enviar la campaña');
  }
}

// Ver detalles de campaña
function verDetalles(id) {
  window.open(`/form_envios.html?campania=${id}&session=haby`, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  cargarCampanias();
  
  // Event delegation para botones
  document.getElementById('campanias-lista').addEventListener('click', (e) => {
    const target = e.target;
    
    if (target.classList.contains('btn-enviar')) {
      const id = Number(target.dataset.id);
      enviarCampania(id);
    }
    
    if (target.classList.contains('btn-detalles')) {
      const id = Number(target.dataset.id);
      verDetalles(id);
    }
  });
});
