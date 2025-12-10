-- Agregar columna ref_ext a ll_lugares si no existe
ALTER TABLE ll_lugares ADD COLUMN ref_ext VARCHAR(64) DEFAULT NULL AFTER abierto;