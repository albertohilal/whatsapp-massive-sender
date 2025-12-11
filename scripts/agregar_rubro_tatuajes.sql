-- Script para agregar rubro Tatuajes a ll_rubros si no existe

-- Verificar si el rubro ya existe
SELECT 'Verificando si existe rubro Tatuajes...' AS info;

SELECT id, area, nombre, nombre_es 
FROM ll_rubros 
WHERE area LIKE '%Tatuajes%' OR nombre LIKE '%tattoo%' OR nombre_es LIKE '%Tatua%'
ORDER BY id;

-- Insertar rubro Tatuajes si no existe (ID sugerido: próximo disponible después de 300)
INSERT INTO ll_rubros (area, nombre, nombre_es, keyword_google, created_at, busqueda, fuente_id)
SELECT 
  'Tatuajes' AS area,
  'tattoo shop' AS nombre,
  'Tatuajes' AS nombre_es,
  'tattoo shop' AS keyword_google,
  NOW() AS created_at,
  1 AS busqueda,
  2 AS fuente_id
WHERE NOT EXISTS (
  SELECT 1 FROM ll_rubros WHERE area = 'Tatuajes' OR nombre = 'tattoo shop'
);

-- Mostrar el ID del rubro Tatuajes
SELECT 
  'ID del rubro Tatuajes:' AS info,
  id, area, nombre, nombre_es 
FROM ll_rubros 
WHERE area = 'Tatuajes' OR nombre = 'tattoo shop'
LIMIT 1;

-- Asignar este rubro a ll_lugares_haby
UPDATE ll_lugares_haby 
SET rubro_id = (SELECT id FROM ll_rubros WHERE area = 'Tatuajes' LIMIT 1)
WHERE rubro_id IS NULL OR rubro_id = 299;

-- Verificar
SELECT 
  'Registros actualizados en ll_lugares_haby:' AS info,
  COUNT(*) AS total,
  COUNT(rubro_id) AS con_rubro_id
FROM ll_lugares_haby;
