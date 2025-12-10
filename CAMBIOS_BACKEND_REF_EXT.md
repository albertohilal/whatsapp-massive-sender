# Actualización de Backend para Nueva Estructura de `ll_lugares_clientes`

## Fecha
10 de diciembre de 2025

## Cambios Realizados

### Archivos Modificados
1. `/routes/envios.js`
2. `/controllers/habysupplyController.js`
3. `/whatsapp-massive-sender/routes/envios.js`
4. `/whatsapp-massive-sender/controllers/habysupplyController.js`

### Descripción del Cambio

Se actualizaron todos los JOINs en el backend para adaptarse a la nueva estructura normalizada de la tabla `ll_lugares_clientes`, que ahora solo contiene:
- `societe_id`
- `ref_ext`
- `cliente_id`

#### Antes (estructura antigua):
```sql
INNER JOIN ll_lugares_clientes ON ll_lugares.id = ll_lugares_clientes.lugar_id
```

#### Después (estructura nueva):
```sql
INNER JOIN ll_lugares_clientes ON ll_lugares_clientes.ref_ext = CONCAT('lugares_', ll_lugares.id)
```

### Justificación

La nueva estructura elimina redundancia y mejora la trazabilidad:
- El campo `lugar_id` ya no existe en `ll_lugares_clientes`.
- Ahora la relación se hace mediante `ref_ext`, que puede ser `lugares_{$id}` o `haby_{$id}`.
- Esto permite vincular leads de múltiples fuentes (scraping, Haby) de manera uniforme.

### Beneficios

1. **Trazabilidad**: El `ref_ext` identifica claramente el origen del lead.
2. **Normalización**: Se eliminan campos redundantes.
3. **Flexibilidad**: Permite agregar nuevas fuentes de datos (ej: `google_{$id}`) sin modificar la estructura.
4. **Sincronización**: Facilita la sincronización automática entre tablas.

### Validación

Se probó manualmente en MySQL Workbench la consulta actualizada:
```sql
SELECT 
  l.id,
  l.nombre,
  l.telefono_wapp,
  l.direccion,
  COALESCE(r.nombre_es, 'Sin rubro') AS rubro,
  lc.cliente_id,
  lc.ref_ext,
  s.rowid AS societe_id
FROM ll_lugares_clientes lc
INNER JOIN ll_lugares l ON lc.ref_ext = CONCAT('lugares_', l.id)
LEFT JOIN ll_rubros r ON l.rubro_id = r.id
LEFT JOIN llxbx_societe s ON lc.societe_id = s.rowid
WHERE lc.cliente_id = 51
  AND l.telefono_wapp IS NOT NULL
  AND l.telefono_wapp != ''
ORDER BY l.nombre;
```

Resultado: La consulta devuelve correctamente los prospectos con todos los datos necesarios.

### Próximos Pasos

1. **Reiniciar el servidor en Contabo** después de hacer `git pull`.
2. **Verificar el funcionamiento del filtro de prospectos** en el frontend.
3. **Probar los endpoints de Haby** para asegurar que funcionan correctamente.
4. **Monitorear logs** para detectar posibles errores residuales.

---

_Este cambio es parte de la nueva lógica de sincronización de tablas documentada en `RESUMEN_SINCRONIZACION_TABLAS.md`._
