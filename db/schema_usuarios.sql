-- Tabla de usuarios con autenticación segura
CREATE TABLE IF NOT EXISTS ll_usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  tipo ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente',
  cliente_id INT NULL,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuario (usuario),
  INDEX idx_tipo (tipo),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios de las columnas
ALTER TABLE ll_usuarios 
  MODIFY COLUMN usuario VARCHAR(100) NOT NULL UNIQUE COMMENT 'Nombre de usuario único',
  MODIFY COLUMN password_hash VARCHAR(255) NOT NULL COMMENT 'Password hasheado con bcrypt',
  MODIFY COLUMN tipo ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente' COMMENT 'Tipo de usuario: admin o cliente',
  MODIFY COLUMN cliente_id INT NULL COMMENT 'ID del cliente (solo para tipo=cliente)',
  MODIFY COLUMN activo TINYINT(1) DEFAULT 1 COMMENT '1=activo, 0=inactivo';
