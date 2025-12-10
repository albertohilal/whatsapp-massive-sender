-- Consulta para verificar si todos los registros de ll_lugares_haby están en llxbx_societe por ref_ext
SELECT h.id, h.nombre, h.telefono_wapp, s.rowid AS societe_id, s.ref_ext AS societe_ref_ext
FROM ll_lugares_haby h
LEFT JOIN llxbx_societe s ON s.ref_ext = CONCAT('haby_', h.id)
WHERE s.rowid IS NULL;

-- Si la consulta no devuelve filas, todos los haby están en societe.