/**
 * Middleware de autenticación
 * Verifica que el usuario tenga una sesión activa
 */
function requireAuth(req, res, next) {
  // Verificar si hay sesión activa
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ 
      error: 'No autorizado. Debes iniciar sesión.',
      code: 'NO_AUTH'
    });
  }
  
  // Usuario autenticado, continuar
  next();
}

/**
 * Middleware para verificar que el usuario sea administrador
 */
function requireAdmin(req, res, next) {
  // Primero verificar autenticación
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ 
      error: 'No autorizado. Debes iniciar sesión.',
      code: 'NO_AUTH'
    });
  }
  
  // Verificar que sea admin
  if (req.session.tipo !== 'admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requieren permisos de administrador.',
      code: 'NO_ADMIN'
    });
  }
  
  // Es admin, continuar
  next();
}

/**
 * Middleware para verificar que el usuario sea cliente
 */
function requireCliente(req, res, next) {
  // Primero verificar autenticación
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ 
      error: 'No autorizado. Debes iniciar sesión.',
      code: 'NO_AUTH'
    });
  }
  
  // Verificar que sea cliente
  if (req.session.tipo !== 'cliente') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Esta ruta es solo para clientes.',
      code: 'NO_CLIENTE'
    });
  }
  
  // Es cliente, continuar
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireCliente
};
