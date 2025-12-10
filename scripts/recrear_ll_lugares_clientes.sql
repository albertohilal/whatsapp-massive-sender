-- Renombrar la tabla actual para resguardo
RENAME TABLE ll_lugares_clientes TO ll_lugares_clientes_backup_20251210;

-- Crear la nueva tabla limpia
CREATE TABLE ll_lugares_clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  societe_id INT NOT NULL,
  ref_ext VARCHAR(64) NOT NULL,
  cliente_id INT NOT NULL,
  INDEX idx_societe (societe_id),
  INDEX idx_ref_ext (ref_ext),
  INDEX idx_cliente (cliente_id)
);

-- Insertar registros para leads scraping (lugares_{$id}) solo si telefono_wapp es válido
to insert scraping leads:
INSERT INTO ll_lugares_clientes (societe_id, ref_ext, cliente_id)
SELECT s.rowid, CONCAT('lugares_', l.id), c.id
FROM ll_lugares l
JOIN llxbx_societe s ON s.ref_ext = CONCAT('lugares_', l.id)
CROSS JOIN clientes c
WHERE l.telefono_wapp IS NOT NULL AND l.telefono_wapp != '';

-- Insertar registros para leads Haby (haby_{$id})
INSERT INTO ll_lugares_clientes (societe_id, ref_ext, cliente_id)
SELECT s.rowid, CONCAT('haby_', h.id), c.id
FROM ll_lugares_haby h
JOIN llxbx_societe s ON s.ref_ext = CONCAT('haby_', h.id)
CROSS JOIN clientes c
WHERE h.telefono_wapp IS NOT NULL AND h.telefono_wapp != '';
