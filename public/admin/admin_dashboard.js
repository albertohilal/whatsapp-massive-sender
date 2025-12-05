// admin_dashboard.js
// Extraído de public/admin/dashboard.html

async function ejecutarAccion(accion) {
  const res = await fetch(`/pm2/${accion}`, { method: 'POST' });
  const data = await res.json();
  alert(`Servidor ${accion}: ${data.status}`);
  cargarEstado();
}

async function cargarEstado() {
  const res = await fetch('/pm2/status');
  const data = await res.json();
  const contenedor = document.getElementById("estado");
  contenedor.innerHTML = data.map(proc => `
    <tr>
      <td>${proc.name}</td>
      <td>${proc.pm_id}</td>
      <td>${proc.pm2_env.status}</td>
      <td>${proc.pm2_env.restart_time}</td>
      <td>${proc.pm2_env.pm_uptime ? new Date(proc.pm2_env.pm_uptime).toLocaleString() : ''}</td>
    </tr>
  `).join('');
}


window.onload = function() {
  cargarEstado();
  // Botones de control del servidor
  const btnIniciar = document.getElementById('btn-iniciar-servidor');
  const btnDetener = document.getElementById('btn-detener-servidor');
  const btnReiniciar = document.getElementById('btn-reiniciar-servidor');
  if (btnIniciar) btnIniciar.addEventListener('click', () => ejecutarAccion('start'));
  if (btnDetener) btnDetener.addEventListener('click', () => ejecutarAccion('stop'));
  if (btnReiniciar) btnReiniciar.addEventListener('click', () => ejecutarAccion('restart'));

  // Botón de iniciar nueva sesión WhatsApp
  const btnIniciarSesion = document.getElementById('btn-iniciar-sesion');
  if (btnIniciarSesion) btnIniciarSesion.addEventListener('click', iniciarSesion);
};

async function mostrarUsuario() {
  const cont = document.getElementById('usuario-logueado');
  try {
    const res = await fetch('/api/usuario-logueado');
    if (!res.ok) {
      cont.textContent = 'Error al consultar usuario';
      cont.style.color = 'red';
      return;
    }
    const data = await res.json();
    if (data && data.usuario) {
      cont.textContent = `Usuario: ${data.usuario}`;
      cont.style.color = '';
    } else {
      cont.textContent = 'No hay usuario logueado';
      cont.style.color = 'orange';
    }
  } catch (err) {
    cont.textContent = 'Error al consultar usuario';
    cont.style.color = 'red';
  }
}
mostrarUsuario();

// Cargar lista de clientes
fetch('/admin/api/clientes')
  .then(res => res.json())
  .then(clientes => {
    console.log('Respuesta clientes:', clientes);
    const select = document.getElementById('select-cliente');
    if (Array.isArray(clientes)) {
      clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nombre;
        select.appendChild(option);
      });
    } else {
      const option = document.createElement('option');
      option.value = "";
      option.textContent = "Error cargando clientes";
      select.appendChild(option);
    }
  });

// Habilitar botón solo si hay cliente seleccionado
document.getElementById('select-cliente').addEventListener('change', function() {
  document.getElementById('btn-ir-panel').disabled = !this.value;
});

// Redirigir al panel del cliente seleccionado
document.getElementById('btn-ir-panel').addEventListener('click', function() {
  const select = document.getElementById('select-cliente');
  let clienteId = select.value;
  let clienteNombre = select.options[select.selectedIndex].text.toLowerCase();
  if (clienteId && clienteNombre) {
    window.location.href = `/${clienteNombre}/dashboard.html?cliente_id=${clienteId}&modo=admin`;
  }
});

async function cargarSesiones() {
  const res = await fetch('/api/sesiones');
  const data = await res.json();
  const contenedor = document.getElementById("sesiones");
  contenedor.innerHTML = data.map(s => `
    <tr>
      <td>${s.session}</td>
      <td><span style="color:${s.activo ? 'green' : 'red'}">${s.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <button onclick="cerrarSesion('${s.session}')">Cerrar</button>
      </td>
      <td>${s.qr ? `<img src='${s.qr}' width='80'/>` : ''}</td>
    </tr>
  `).join('');
}
async function iniciarSesion() {
  const nombre = document.getElementById('nuevoSessionName').value.trim();
  if (!nombre) return alert('Ingresa un nombre de sesión');
  await fetch(`/api/sesiones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre }) });
  cargarSesiones();
}
async function cerrarSesion(nombre) {
  await fetch(`/api/sesiones/${nombre}`, { method: 'DELETE' });
  cargarSesiones();
}
window.addEventListener('DOMContentLoaded', cargarSesiones);
