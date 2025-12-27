-- Tabla de configuración del bot de respuestas automáticas
-- Permite activar/desactivar respuestas automáticas desde el panel del cliente

CREATE TABLE IF NOT EXISTS `ll_bot_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `bot_activo` tinyint(1) DEFAULT 0 COMMENT '0=Solo escucha, 1=Responde automáticamente',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cliente` (`cliente_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Insertar configuración por defecto para Haby (cliente 51)
-- Desactivado por defecto (solo escucha)
INSERT INTO `ll_bot_config` (`cliente_id`, `bot_activo`) VALUES (51, 0)
ON DUPLICATE KEY UPDATE `bot_activo` = 0;
