# Solución: Agregar campo rubro a llxbx_societe

## Problema
- Las consultas actuales usan `llxbx_societe` como tabla centralizada
- El campo `rubro` es importante para filtrado/visualización
- `fk_typent` de Dolibarr NO es rubro (es tipo de entidad empresarial)
- Necesitamos vincular `llxbx_societe` con `ll_rubros` sin hacer JOIN a tablas origen

## Análisis de Opciones

### ❌ Opción 1: Reutilizar campo existente (price_level, fk_forme_juridique)
- **Ventaja**: No requiere ALTER TABLE
- **Desventaja**: Semánticamente incorrecto, confuso para mantenimiento

### ❌ Opción 2: Usar sistema de extrafields de Dolibarr
- **Ventaja**: Siguiendo estándar de Dolibarr
- **Desventaja**: Requiere JOIN adicional en cada query (bajo rendimiento)

### ✅ Opción 3: Agregar columna rubro_id directa (RECOMENDADA)
- **Ventajas**:
  - Semánticamente correcto
  - Mejor rendimiento (no requiere JOIN extra)
  - Simple de mantener
  - Dolibarr ya usa ref_ext de forma custom, precedente establecido
- **Desventaja**: Requiere ALTER TABLE (única vez)

## Implementación

### 1. Ejecutar ALTER TABLE (una sola vez)

```bash
# Opción A: Usando script SQL
mysql -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} -P${DB_PORT} ${DB_DATABASE} < scripts/agregar_rubro_societe.sql

# Opción B: Usando script Node.js (requiere confirmación manual)
node scripts/sincronizar_rubro_societe.js
```

El script SQL es **idempotente** (puede ejecutarse múltiples veces sin problema).

### 2. Sincronizar datos iniciales

El script ya incluye la sincronización:
```sql
UPDATE llxbx_societe s
INNER JOIN ll_lugares l ON s.ref_ext = CONCAT('lugares_', l.id)
SET s.rubro_id = l.rubro_id
WHERE l.rubro_id IS NOT NULL;
```

### 3. Mantener sincronización automática

Agregar actualización de rubro_id en `scripts/recrear_ll_lugares_clientes.js`:
```javascript
// Después de insertar/actualizar en llxbx_societe
await conn.query(`
  UPDATE llxbx_societe s
  INNER JOIN ll_lugares l ON s.ref_ext = CONCAT('lugares_', l.id)
  SET s.rubro_id = l.rubro_id
  WHERE l.rubro_id IS NOT NULL
`);
```

### 4. Actualizar consultas en routes/envios.js

```javascript
// Consulta mejorada con rubro
SELECT 
  s.rowid AS id,
  s.nom AS nombre,
  s.address AS direccion,
  s.phone_mobile AS telefono_wapp,
  1 AS wapp_valido,
  COALESCE(r.nombre, 'Sin rubro') AS rubro,
  'sin_envio' AS estado
FROM llxbx_societe s
INNER JOIN ll_lugares_clientes lc ON lc.societe_id = s.rowid
LEFT JOIN ll_rubros r ON s.rubro_id = r.id
WHERE s.rowid NOT IN (
  SELECT DISTINCT lugar_id 
  FROM ll_envios_whatsapp 
  WHERE lugar_id IS NOT NULL 
  AND (estado = 'enviado' OR estado = 'pendiente')
)
AND lc.cliente_id = ?
ORDER BY s.nom
```

## Estadísticas Actuales

- **ll_lugares**: 1277 registros, 100% con rubro_id
- **ll_rubros**: 300 rubros catalogados
- **Rubros más usados**: 
  - ID 133: 636 lugares
  - ID 296: 181 lugares
  - ID 297: 141 lugares
  - ID 89: 131 lugares

## Beneficios de esta Solución

1. ✅ **Arquitectura limpia**: Solo consulta `llxbx_societe` + `ll_rubros`
2. ✅ **Alto rendimiento**: Un solo JOIN opcional (LEFT JOIN ll_rubros)
3. ✅ **Mantenible**: Semánticamente correcto, fácil de entender
4. ✅ **Compatible**: No interfiere con funcionalidad de Dolibarr
5. ✅ **Escalable**: Fácil agregar sincronización desde otras fuentes

## Próximos Pasos

1. [ ] Ejecutar `scripts/agregar_rubro_societe.sql` en base de datos
2. [ ] Verificar con `node scripts/sincronizar_rubro_societe.js`
3. [ ] Actualizar query en `routes/envios.js`
4. [ ] Actualizar frontend `form_envios.html` si es necesario
5. [ ] Agregar sincronización a script de cron job
6. [ ] Commit y push a GitHub
7. [ ] Deploy a Contabo

## Comandos de Ejecución

```bash
# 1. Agregar campo y sincronizar
mysql -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} -P${DB_PORT} ${DB_DATABASE} < scripts/agregar_rubro_societe.sql

# 2. Verificar
node scripts/sincronizar_rubro_societe.js

# 3. Actualizar código (manual)

# 4. Commit
git add .
git commit -m "Agregar campo rubro_id a llxbx_societe para consultas centralizadas"
git push

# 5. Deploy en Contabo
ssh user@contabo
cd /path/to/project
git pull
pm2 restart app
```
