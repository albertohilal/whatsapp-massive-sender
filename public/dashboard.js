// dashboard.js
// Extraído de dashboard.html para cumplir CSP

async function ejecutarAccion(accion) {
  const res = await fetch(`/pm2/${accion}`, { method: 'POST' });
  const data = await res.json();
  alert(`Servidor ${accion}: ${data.status}`);
  cargarEstado();
}

async function controlarProceso(processName, accion) {
  if (!confirm(`¿Confirmas ${accion} el proceso "${processName}"?`)) return;
  
  try {
    const res = await fetch(`/pm2/proceso/${accion}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processName })
    });
    const data = await res.json();
    
    if (data.error) {
      alert(`Error: ${data.error}`);
    } else {
      alert(`Proceso "${processName}" - ${accion}: ${data.message || 'Completado'}`);
    }
  } catch (err) {
    alert(`Error al ejecutar ${accion}: ${err.message}`);
  }
  
  cargarEstado();
}

async function cargarEstado() {
  const res = await fetch('/pm2/status');
  const data = await res.json();
  console.log('📊 Datos PM2 recibidos:', data);
  const contenedor = document.getElementById("estado");
  contenedor.innerHTML = data.map(proc => {
    const isOnline = proc.pm2_env.status === 'online';
    const statusColor = isOnline ? 'green' : 'red';
    console.log(`🔧 Procesando: ${proc.name}, online: ${isOnline}`);
    return `
      <tr>
        <td>${proc.name}</td>
        <td>${proc.pm_id}</td>
        <td><span style="color:${statusColor};font-weight:bold">${proc.pm2_env.status}</span></td>
        <td>${proc.pm2_env.restart_time}</td>
        <td>${proc.pm2_env.pm_uptime ? new Date(proc.pm2_env.pm_uptime).toLocaleString() : ''}</td>
        <td>
          <button onclick="controlarProceso('${proc.name}', 'start')" ${isOnline ? 'disabled' : ''} style="padding:4px 8px;font-size:12px;margin:2px">▶ Iniciar</button>
          <button onclick="controlarProceso('${proc.name}', 'stop')" ${!isOnline ? 'disabled' : ''} style="padding:4px 8px;font-size:12px;margin:2px">⏹ Detener</button>
          <button onclick="controlarProceso('${proc.name}', 'restart')" ${!isOnline ? 'disabled' : ''} style="padding:4px 8px;font-size:12px;margin:2px">🔄 Reiniciar</button>
        </td>
      </tr>
    `;
  }).join('');
  console.log('✅ HTML generado y asignado al contenedor');
}

async function mostrarUsuario() {
  try {
    const res = await fetch('/api/usuario-logueado');
    const data = await res.json();
    if (data && data.usuario) {
      document.getElementById('usuario-logueado').textContent = `Usuario: ${data.usuario}`;
    }
  } catch (err) {
    document.getElementById('usuario-logueado').textContent = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  mostrarUsuario();
  cargarEstado();
  cargarSesiones();
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
        <button onclick="validarSesion('${s.session}')">Validar</button>
        <button onclick="detenerSesion('${s.session}')">Detener</button>
      </td>
      <td id="qr-${s.session}"></td>
    </tr>
  `).join('');
}

async function iniciarSesion() {
  const sessionName = document.getElementById('nuevoSessionName').value.trim();
  if (!sessionName) return alert('Ingresa el nombre de la sesión');
  
  try {
    const res = await fetch('/api/sesiones/iniciar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionName })
    });
    const data = await res.json();
    
    if (data.error) {
      alert(`Error al iniciar sesión: ${data.error}`);
      return;
    }
    
    if (data.status === 'iniciando') {
      alert(`Sesión "${sessionName}" iniciándose. Revisa la consola del servidor para ver el QR o escanéalo desde la ventana de Chrome que se abre.`);
    }
    
    // Recargar las sesiones después de un momento
    setTimeout(() => {
      cargarSesiones();
    }, 2000);
    
  } catch (err) {
    alert(`Error de red: ${err.message}`);
  }
}

async function validarSesion(sessionName) {
  const res = await fetch(`/api/sesiones/${sessionName}/validar`);
  const data = await res.json();
  alert(`Sesión ${sessionName}: ${data.activo ? 'Activa' : 'Inactiva'}`);
  cargarSesiones();
}

async function detenerSesion(sessionName) {
  await fetch(`/api/sesiones/${sessionName}/detener`, { method: 'POST' });
  alert(`Sesión ${sessionName} detenida (placeholder)`);
  cargarSesiones();
}

window.ejecutarAccion = ejecutarAccion;
window.controlarProceso = controlarProceso;
window.iniciarSesion = iniciarSesion;
window.validarSesion = validarSesion;
window.detenerSesion = detenerSesion;
