-- Script para crear tabla ll_societe_extended (extensión custom de llxbx_societe)
-- Esta tabla es completamente nuestra y no será afectada por upgrades de Dolibarr

-- PASO 1: Agregar campo rubro_id a ll_lugares_haby si no existe
SET @dbname = DATABASE();
SET @tablename = 'll_lugares_haby';
SET @columnname = 'rubro_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE 
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "Column rubro_id already exists in ll_lugares_haby" AS info;',
  'ALTER TABLE ll_lugares_haby ADD COLUMN rubro_id INT(11) NULL COMMENT "FK a ll_rubros.id", ADD INDEX idx_rubro_id (rubro_id);'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- PASO 1.5: Asignar rubro Tatuajes a todos los registros de ll_lugares_haby
UPDATE ll_lugares_haby 
SET rubro_id = (SELECT id FROM ll_rubros WHERE area = 'Tatuajes' LIMIT 1)
WHERE rubro_id IS NULL;

-- PASO 2: Crear tabla ll_societe_extended
CREATE TABLE IF NOT EXISTS ll_societe_extended (
  societe_id INT(11) NOT NULL PRIMARY KEY COMMENT 'FK a llxbx_societe.rowid',
  rubro_id INT(11) NULL COMMENT 'FK a ll_rubros.id',
  origen VARCHAR(50) NULL COMMENT 'Fuente: google_places, haby, manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rubro (rubro_id),
  INDEX idx_origen (origen),
  FOREIGN KEY (societe_id) REFERENCES llxbx_societe(rowid) ON DELETE CASCADE,
  FOREIGN KEY (rubro_id) REFERENCES ll_rubros(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
COMMENT='Extensión custom de llxbx_societe - inmune a upgrades de Dolibarr';

-- PASO 3: Poblar con datos de ll_lugares (scraping)
INSERT INTO ll_societe_extended (societe_id, rubro_id, origen)
SELECT s.rowid, l.rubro_id, 'google_places'
FROM llxbx_societe s
INNER JOIN ll_lugares l ON s.ref_ext = CONCAT('lugares_', l.id)
WHERE l.rubro_id IS NOT NULL
ON DUPLICATE KEY UPDATE 
  rubro_id = VALUES(rubro_id),
  origen = VALUES(origen),
  updated_at = CURRENT_TIMESTAMP;

-- PASO 4: Poblar con datos de ll_lugares_haby (si tiene rubro_id)
INSERT INTO ll_societe_extended (societe_id, rubro_id, origen)
SELECT s.rowid, h.rubro_id, 'haby'
FROM llxbx_societe s
INNER JOIN ll_lugares_haby h ON s.ref_ext = CONCAT('haby_', h.id)
WHERE h.rubro_id IS NOT NULL
ON DUPLICATE KEY UPDATE 
  rubro_id = VALUES(rubro_id),
  origen = VALUES(origen),
  updated_at = CURRENT_TIMESTAMP;

-- PASO 5: Estadísticas
SELECT 
  'Estadísticas ll_societe_extended' AS info,
  COUNT(*) AS total_registros,
  COUNT(rubro_id) AS con_rubro_id,
  COUNT(*) - COUNT(rubro_id) AS sin_rubro_id,
  COUNT(DISTINCT rubro_id) AS rubros_distintos,
  COUNT(DISTINCT origen) AS fuentes_distintas
FROM ll_societe_extended;

-- PASO 6: Distribución por origen
SELECT 
  origen,
  COUNT(*) AS cantidad,
  COUNT(rubro_id) AS con_rubro,
  ROUND(COUNT(rubro_id) * 100.0 / COUNT(*), 2) AS porcentaje_con_rubro
FROM ll_societe_extended
GROUP BY origen;

-- PASO 7: Top 10 rubros más usados
SELECT 
  se.rubro_id,
  r.nombre AS rubro_nombre,
  COUNT(*) AS cantidad_societes,
  GROUP_CONCAT(DISTINCT se.origen) AS fuentes
FROM ll_societe_extended se
LEFT JOIN ll_rubros r ON se.rubro_id = r.id
WHERE se.rubro_id IS NOT NULL
GROUP BY se.rubro_id, r.nombre
ORDER BY cantidad_societes DESC
LIMIT 10;

-- PASO 8: Prueba de consulta completa
SELECT 
  s.rowid AS id,
  s.nom AS nombre,
  s.phone_mobile AS telefono_wapp,
  COALESCE(r.nombre, 'Sin rubro') AS rubro,
  se.origen
FROM llxbx_societe s
LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
LEFT JOIN ll_rubros r ON se.rubro_id = r.id
LIMIT 10;

-- 3. Estadísticas
SELECT 
  'Estadísticas ll_societe_extended' AS info,
  COUNT(*) AS total_registros,
  COUNT(rubro_id) AS con_rubro_id,
  COUNT(*) - COUNT(rubro_id) AS sin_rubro_id,
  COUNT(DISTINCT rubro_id) AS rubros_distintos
FROM ll_societe_extended;

-- 4. Distribución de rubros
SELECT 
  se.rubro_id,
  r.nombre AS rubro_nombre,
  COUNT(*) AS cantidad
FROM ll_societe_extended se
LEFT JOIN ll_rubros r ON se.rubro_id = r.id
WHERE se.rubro_id IS NOT NULL
GROUP BY se.rubro_id, r.nombre
ORDER BY cantidad DESC
LIMIT 10;

-- 5. Prueba de consulta
SELECT 
  s.rowid AS id,
  s.nom AS nombre,
  s.phone_mobile AS telefono_wapp,
  COALESCE(r.nombre, 'Sin rubro') AS rubro
FROM llxbx_societe s
LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
LEFT JOIN ll_rubros r ON se.rubro_id = r.id
LIMIT 10;
