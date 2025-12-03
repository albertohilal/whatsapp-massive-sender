CREATE TABLE IF NOT EXISTS ll_programaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campania_id INT NOT NULL,
  cliente_id INT NOT NULL,
  dias_semana VARCHAR(64) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  cupo_diario INT NOT NULL DEFAULT 50,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE DEFAULT NULL,
  estado ENUM('pendiente','aprobada','rechazada','pausada') NOT NULL DEFAULT 'pendiente',
  comentario_cliente TEXT DEFAULT NULL,
  comentario_admin TEXT DEFAULT NULL,
  creado_por VARCHAR(120) DEFAULT NULL,
  aprobado_por VARCHAR(120) DEFAULT NULL,
  sesion_cliente VARCHAR(120) DEFAULT NULL,
  aprobado_en DATETIME DEFAULT NULL,
  rechazo_motivo TEXT DEFAULT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_programaciones_campania (campania_id),
  INDEX idx_programaciones_cliente (cliente_id),
  INDEX idx_programaciones_estado (estado),
  CONSTRAINT fk_programaciones_campania FOREIGN KEY (campania_id)
    REFERENCES ll_campanias_whatsapp(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ll_programacion_envios_diarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  programacion_id INT NOT NULL,
  fecha DATE NOT NULL,
  enviados INT NOT NULL DEFAULT 0,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_programacion_fecha (programacion_id, fecha),
  CONSTRAINT fk_prog_envios_programacion FOREIGN KEY (programacion_id)
    REFERENCES ll_programaciones(id) ON DELETE CASCADE
);
