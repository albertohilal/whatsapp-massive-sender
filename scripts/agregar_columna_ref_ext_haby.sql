-- Agregar columna ref_ext a ll_lugares_haby
ALTER TABLE ll_lugares_haby ADD COLUMN ref_ext VARCHAR(64) DEFAULT NULL AFTER nombre;