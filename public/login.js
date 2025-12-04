document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;
  const errorBox = document.getElementById('loginError');
  errorBox.style.display = 'none';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });
    const data = await res.json();
    if (data.ok) {
      window.location.href = data.redirect;
    } else {
      throw new Error(data.error || data.details || 'Credenciales incorrectas');
    }
  } catch (err) {
    errorBox.textContent = err.message || 'No se pudo iniciar sesión. Intenta nuevamente.';
    errorBox.style.display = 'block';
  }
});
