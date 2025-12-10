-- Quitar restricción UNIQUE y agregar columna ref_ext a ll_lugares_clientes
ALTER TABLE ll_lugares_clientes DROP INDEX unique_lugar_cliente;
ALTER TABLE ll_lugares_clientes ADD COLUMN ref_ext VARCHAR(64) DEFAULT NULL AFTER societe_id;