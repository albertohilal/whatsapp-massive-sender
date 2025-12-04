(function () {
  const BUTTON_ID = 'btn-volver-dashboard';

  async function initDashboardButton() {
    if (!document.body || document.getElementById(BUTTON_ID)) {
      return;
    }

    let userData;
    try {
      const res = await fetch('/api/usuario-logueado');
      if (!res.ok) return;
      userData = await res.json();
    } catch (err) {
      console.warn('No se pudo obtener el usuario para botón de dashboard:', err);
      return;
    }

    if (!userData || !userData.usuario) {
      return;
    }

    const dashboardUrl = buildDashboardUrl(userData);
    if (!dashboardUrl) {
      return;
    }

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.textContent = 'Volver al dashboard';
    button.style.position = 'fixed';
    button.style.top = '24px';
    button.style.right = '24px';
    button.style.zIndex = '9999';
    button.style.padding = '10px 18px';
    button.style.border = 'none';
    button.style.borderRadius = '999px';
    button.style.backgroundColor = '#1d4ed8';
    button.style.color = '#fff';
    button.style.fontSize = '0.95rem';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.18)';

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#153ca8';
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#1d4ed8';
    });
    button.addEventListener('click', () => {
      window.location.href = dashboardUrl;
    });

    document.body.appendChild(button);
  }

  function buildDashboardUrl(userData) {
    if (!userData) return null;
    if (userData.tipo === 'admin') {
      return '/admin/dashboard.html';
    }
    const userLower = (userData.usuario || '').toLowerCase();
    if (!userLower) {
      return null;
    }
    if (userLower === 'haby' || userLower === 'habysupply') {
      return `/${userLower}/dashboard.html`;
    }
    return `/public/${userLower}/dashboard.html`;
  }

  document.addEventListener('DOMContentLoaded', initDashboardButton);
})();
