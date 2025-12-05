// admin_usuarios.js
// Extraído de public/admin/usuarios.html

let modoEdicion = false;
let usuarioEditandoId = null;

document.addEventListener('DOMContentLoaded', () => {
  cargarUsuarioLogueado();
  cargarUsuarios();

  // Botón crear usuario (header)
  const btnCrear = document.querySelector('.btn.btn-success');
  if (btnCrear) btnCrear.addEventListener('click', abrirModalCrear);

  // Botón crear usuario (empty state)
  const btnCrearEmpty = document.querySelector('#empty-state .btn.btn-success');
  if (btnCrearEmpty) btnCrearEmpty.addEventListener('click', abrirModalCrear);

  // Modal cerrar (X)
  const btnCerrarModal = document.querySelector('.modal .close');
  if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);

  // Modal cerrar (fondo)
  document.getElementById('modal-usuario').addEventListener('click', function(e) {
    if (e.target === this) cerrarModal();
  });

  // Form submit
  document.getElementById('form-usuario').addEventListener('submit', guardarUsuario);

  // Select tipo (toggle cliente id)
  document.getElementById('tipo').addEventListener('change', toggleClienteId);
});

async function cargarUsuarioLogueado() {
  try {
    const res = await fetch('/api/usuario-logueado');
    const data = await res.json();
    if (data.usuario) {
      document.getElementById('usuario-logueado').textContent = data.usuario;
    }
  } catch (error) {
    console.error('Error al cargar usuario:', error);
  }
}

async function cargarUsuarios() {
  try {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('tabla-usuarios').style.display = 'none';
    document.getElementById('empty-state').style.display = 'none';

    const res = await fetch('/api/usuarios');
    const data = await res.json();

    if (!data.ok) throw new Error(data.error);

    const tbody = document.getElementById('tbody-usuarios');
    tbody.innerHTML = '';

    if (data.usuarios.length === 0) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('empty-state').style.display = 'block';
      return;
    }

    data.usuarios.forEach(usuario => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${usuario.id}</td>
        <td><strong>${usuario.usuario}</strong></td>
        <td><span class="badge badge-${usuario.tipo}">${usuario.tipo}</span></td>
        <td>${usuario.cliente_id || '-'}</td>
        <td><span class="badge badge-${usuario.activo ? 'activo' : 'inactivo'}">${usuario.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td class="actions">
          <button class="btn btn-warning btn-small btn-editar" data-id="${usuario.id}">✏️ Editar</button>
          ${usuario.activo ? 
            `<button class="btn btn-danger btn-small btn-eliminar" data-id="${usuario.id}" data-usuario="${usuario.usuario}">🗑️ Desactivar</button>` :
            `<button class="btn btn-success btn-small btn-activar" data-id="${usuario.id}">✅ Activar</button>`
          }
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Delegación de eventos para acciones
    tbody.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', e => editarUsuario(btn.dataset.id));
    });
    tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', e => eliminarUsuario(btn.dataset.id, btn.dataset.usuario));
    });
    tbody.querySelectorAll('.btn-activar').forEach(btn => {
      btn.addEventListener('click', e => activarUsuario(btn.dataset.id));
    });

    document.getElementById('loading').style.display = 'none';
    document.getElementById('tabla-usuarios').style.display = 'table';
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    alert('Error al cargar usuarios: ' + error.message);
    document.getElementById('loading').style.display = 'none';
  }
}

function abrirModalCrear() {
  modoEdicion = false;
  usuarioEditandoId = null;
  document.getElementById('modal-titulo').textContent = 'Crear Usuario';
  document.getElementById('form-usuario').reset();
  document.getElementById('usuario-id').value = '';
  document.getElementById('password').required = true;
  document.getElementById('password-opcional').textContent = '*';
  document.getElementById('activo').checked = true;
  document.getElementById('grupo-cliente-id').style.display = 'none';
  document.getElementById('modal-usuario').classList.add('show');
}

async function editarUsuario(id) {
  try {
    const res = await fetch(`/api/usuarios/${id}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    const usuario = data.usuario;
    modoEdicion = true;
    usuarioEditandoId = id;
    document.getElementById('modal-titulo').textContent = 'Editar Usuario';
    document.getElementById('usuario-id').value = usuario.id;
    document.getElementById('usuario').value = usuario.usuario;
    document.getElementById('password').value = '';
    document.getElementById('password').required = false;
    document.getElementById('password-opcional').textContent = '(dejar vacío para no cambiar)';
    document.getElementById('tipo').value = usuario.tipo;
    document.getElementById('cliente_id').value = usuario.cliente_id || '';
    document.getElementById('activo').checked = usuario.activo === 1;
    toggleClienteId();
    document.getElementById('modal-usuario').classList.add('show');
  } catch (error) {
    console.error('Error al cargar usuario:', error);
    alert('Error al cargar usuario: ' + error.message);
  }
}

async function guardarUsuario(event) {
  event.preventDefault();
  const id = document.getElementById('usuario-id').value;
  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;
  const tipo = document.getElementById('tipo').value;
  const cliente_id = document.getElementById('cliente_id').value;
  const activo = document.getElementById('activo').checked;
  if (tipo === 'cliente' && !cliente_id) {
    alert('Para tipo "cliente" se requiere Cliente ID');
    return;
  }
  if (!modoEdicion && !password) {
    alert('La contraseña es requerida para crear un usuario');
    return;
  }
  if (password && (password.length < 6 || password.length > 13)) {
    alert('La contraseña debe tener entre 6 y 13 caracteres');
    return;
  }
  const body = {
    usuario,
    tipo,
    cliente_id: cliente_id || null,
    activo
  };
  if (password) body.password = password;
  try {
    const url = modoEdicion ? `/api/usuarios/${id}` : '/api/usuarios';
    const method = modoEdicion ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    alert(data.message);
    cerrarModal();
    cargarUsuarios();
  } catch (error) {
    console.error('Error al guardar usuario:', error);
    alert('Error al guardar usuario: ' + error.message);
  }
}

async function eliminarUsuario(id, usuario) {
  if (!confirm(`¿Estás seguro de desactivar el usuario "${usuario}"?`)) return;
  try {
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    alert(data.message);
    cargarUsuarios();
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    alert('Error al eliminar usuario: ' + error.message);
  }
}

async function activarUsuario(id) {
  try {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: true })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    alert(data.message);
    cargarUsuarios();
  } catch (error) {
    console.error('Error al activar usuario:', error);
    alert('Error al activar usuario: ' + error.message);
  }
}

function cerrarModal() {
  document.getElementById('modal-usuario').classList.remove('show');
}

function toggleClienteId() {
  const tipo = document.getElementById('tipo').value;
  const grupoClienteId = document.getElementById('grupo-cliente-id');
  const clienteIdInput = document.getElementById('cliente_id');
  if (tipo === 'cliente') {
    grupoClienteId.style.display = 'block';
    clienteIdInput.required = true;
  } else {
    grupoClienteId.style.display = 'none';
    clienteIdInput.required = false;
    clienteIdInput.value = '';
  }
}
