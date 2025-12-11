-- Script SQL para agregar campo rubro_id a llxbx_societe
-- Este script es idempotente (puede ejecutarse varias veces sin problema)

-- 1. Verificar si la columna ya existe antes de agregarla
SET @dbname = DATABASE();
SET @tablename = 'llxbx_societe';
SET @columnname = 'rubro_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE 
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "Column rubro_id already exists" AS info;',
  'ALTER TABLE llxbx_societe ADD COLUMN rubro_id INT NULL COMMENT "ID del rubro de ll_rubros";'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Agregar índice si no existe
SET @indexname = 'idx_rubro_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE 
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND INDEX_NAME = @indexname
  ) > 0,
  'SELECT "Index idx_rubro_id already exists" AS info;',
  'ALTER TABLE llxbx_societe ADD INDEX idx_rubro_id (rubro_id);'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Sincronizar datos desde ll_lugares
UPDATE llxbx_societe s
INNER JOIN ll_lugares l ON s.ref_ext = CONCAT('lugares_', l.id)
SET s.rubro_id = l.rubro_id
WHERE l.rubro_id IS NOT NULL AND s.rubro_id IS NULL;

-- 4. Mostrar estadísticas
SELECT 
  'Estadísticas de sincronización' AS info,
  COUNT(*) AS total_societes,
  COUNT(rubro_id) AS con_rubro_id,
  COUNT(*) - COUNT(rubro_id) AS sin_rubro_id,
  COUNT(DISTINCT rubro_id) AS rubros_distintos
FROM llxbx_societe;

-- 5. Mostrar distribución de rubros
SELECT 
  s.rubro_id,
  r.nombre AS rubro_nombre,
  COUNT(*) AS cantidad_societes
FROM llxbx_societe s
LEFT JOIN ll_rubros r ON s.rubro_id = r.id
WHERE s.rubro_id IS NOT NULL
GROUP BY s.rubro_id, r.nombre
ORDER BY cantidad_societes DESC
LIMIT 10;
