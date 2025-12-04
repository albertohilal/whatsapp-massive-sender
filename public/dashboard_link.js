(function () {
  const DASHBOARD_BUTTON_ID = 'btn-volver-dashboard';
  const LOGOUT_BUTTON_ID = 'btn-cerrar-sesion';
  let containerInfo = null;

  async function initActionButtons() {
    if (!document.body) {
      return;
    }

    removeExistingButtons();

    let userData;
    try {
      const res = await fetch('/api/usuario-logueado');
      if (!res.ok) return;
      userData = await res.json();
    } catch (err) {
      console.warn('No se pudo obtener al usuario para los botones de acceso:', err);
      return;
    }

    if (!userData || !userData.usuario) {
      return;
    }

    const dashboardUrl = buildDashboardUrl(userData);
    if (!dashboardUrl) {
      return;
    }

    const container = ensureContainer();
    const dashboardButton = createActionButton({
      id: DASHBOARD_BUTTON_ID,
      text: 'Volver al dashboard',
      background: '#1d4ed8',
      hoverBackground: '#153ca8',
      onClick: () => {
        window.location.href = dashboardUrl;
      }
    });

    const logoutButton = createActionButton({
      id: LOGOUT_BUTTON_ID,
      text: 'Salir',
      background: '#ef4444',
      hoverBackground: '#b91c1c'
    });
    logoutButton.addEventListener('click', () => handleLogout(logoutButton));

    container.appendChild(dashboardButton);
    container.appendChild(logoutButton);
  }

  function removeExistingButtons() {
    const dashboardButton = document.getElementById(DASHBOARD_BUTTON_ID);
    if (dashboardButton) {
      dashboardButton.remove();
    }
    const logoutButton = document.getElementById(LOGOUT_BUTTON_ID);
    if (logoutButton) {
      logoutButton.remove();
    }
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

  function ensureContainer() {
    if (containerInfo) {
      return containerInfo.element;
    }
    const anchor = document.getElementById('dashboard-button-anchor');
    if (anchor) {
      anchor.style.display = 'flex';
      anchor.style.gap = '0.5rem';
      anchor.style.flexWrap = 'wrap';
      anchor.style.justifyContent = 'flex-end';
      containerInfo = { element: anchor, inline: true };
      return anchor;
    }

    let floating = document.getElementById('dashboard-floating-container');
    if (!floating) {
      floating = document.createElement('div');
      floating.id = 'dashboard-floating-container';
      floating.style.position = 'fixed';
      floating.style.top = '24px';
      floating.style.right = '24px';
      floating.style.zIndex = '9999';
      floating.style.display = 'flex';
      floating.style.flexDirection = 'column';
      floating.style.alignItems = 'flex-end';
      floating.style.gap = '12px';
      document.body.appendChild(floating);
    }
    containerInfo = { element: floating, inline: false };
    return floating;
  }

  function createActionButton({ id, text, background, hoverBackground, onClick }) {
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.textContent = text;
    button.dataset.defaultBg = background;
    button.dataset.hoverBg = hoverBackground || background;
    applyBaseStyles(button, background);
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = button.dataset.hoverBg;
    });
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = button.dataset.defaultBg;
    });
    if (typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }
    return button;
  }

  function applyBaseStyles(button, background) {
    button.style.padding = '10px 18px';
    button.style.border = 'none';
    button.style.borderRadius = '999px';
    button.style.backgroundColor = background;
    button.style.color = '#fff';
    button.style.fontSize = '0.95rem';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.18)';
    button.style.transition = 'background-color 0.2s ease, opacity 0.2s ease';
  }

  async function handleLogout(button) {
    if (button.disabled) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Cerrando...';
    button.style.opacity = '0.8';

    try {
      const res = await fetch('/api/logout', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Respuesta inválida del servidor');
      }
      window.location.href = '/';
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      alert('No se pudo cerrar la sesión. Intenta nuevamente.');
      button.disabled = false;
      button.textContent = originalText;
      button.style.opacity = '1';
    }
  }

  document.addEventListener('DOMContentLoaded', initActionButtons);
})();
