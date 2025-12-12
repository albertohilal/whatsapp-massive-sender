# Solución Final: Campo Rubro con ll_societe_extended

## 📋 Problema Resuelto

Necesitábamos mostrar el campo `rubro` en las consultas sin hacer JOIN a tablas origen (`ll_lugares`, `ll_lugares_haby`), manteniendo la arquitectura centralizada en `llxbx_societe`.

## ✅ Solución Implementada

### Estrategia: Tabla Intermedia `ll_societe_extended`

**Ventajas:**
- ✅ **Inmune a upgrades de Dolibarr** (tabla propia con prefijo `ll_`)
- ✅ **Extensible** (podemos agregar más campos custom en el futuro)
- ✅ **Consultas eficientes** (un solo LEFT JOIN adicional)
- ✅ **Integridad referencial** (ON DELETE CASCADE)

## 🏗️ Estructura Implementada

### 1. Tabla `ll_societe_extended`

```sql
CREATE TABLE ll_societe_extended (
  societe_id INT(11) NOT NULL PRIMARY KEY,
  rubro_id INT(11) NULL,
  origen VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rubro (rubro_id),
  INDEX idx_origen (origen),
  FOREIGN KEY (societe_id) REFERENCES llxbx_societe(rowid) ON DELETE CASCADE,
  FOREIGN KEY (rubro_id) REFERENCES ll_rubros(id) ON DELETE SET NULL
);
```

### 2. Fuentes de Datos

**`ll_lugares` (Scraping Google Places):**
- ✅ Ya tiene campo `rubro_id`
- ✅ 100% poblado (1277 registros)
- ✅ 7 rubros distintos en uso

**`ll_lugares_haby` (Clientes Haby):**
- ⚙️ Agregar campo `rubro_id` (script lo hace automáticamente)
- 📝 Poblar manualmente según necesidad

### 3. Consulta Final

```sql
SELECT 
  s.rowid AS id,
  s.nom AS nombre,
  s.address AS direccion,
  s.phone_mobile AS telefono_wapp,
  COALESCE(r.nombre, 'Sin rubro') AS rubro,
  se.origen
FROM llxbx_societe s
INNER JOIN ll_lugares_clientes lc ON lc.societe_id = s.rowid
LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
LEFT JOIN ll_rubros r ON se.rubro_id = r.id
WHERE lc.cliente_id = ?
ORDER BY s.nom
```

## 🚀 Pasos de Implementación

### Paso 1: Ejecutar Script SQL

```bash
mysql -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} -P${DB_PORT} ${DB_DATABASE} < scripts/crear_ll_societe_extended.sql
```

Este script hace:
1. Agrega `rubro_id` a `ll_lugares_haby` (si no existe)
2. Crea tabla `ll_societe_extended`
3. Pobla desde `ll_lugares` (origen: google_places)
4. Pobla desde `ll_lugares_haby` (origen: haby)
5. Muestra estadísticas y distribución

### Paso 2: Verificar Implementación

```bash
# Ver estadísticas
mysql -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} -P${DB_PORT} ${DB_DATABASE} -e "
  SELECT 
    COUNT(*) AS total,
    COUNT(rubro_id) AS con_rubro,
    COUNT(DISTINCT rubro_id) AS rubros_distintos,
    COUNT(DISTINCT origen) AS fuentes
  FROM ll_societe_extended;
"
```

### Paso 3: Actualizar Sincronización Automática

El script `recrear_ll_lugares_clientes.js` ya fue actualizado para:
- Sincronizar `ll_societe_extended` después de poblar `ll_lugares_clientes`
- Mantener campo `rubro_id` actualizado

### Paso 4: Actualizar Consultas Backend

✅ Ya implementado en `routes/envios.js`:
- Query de prospectos sin envío usa `ll_societe_extended`
- JOIN con `ll_rubros` para obtener nombre del rubro
- Filtro por rubro funciona correctamente

## 📊 Estadísticas Esperadas

Después de ejecutar el script:

```
total_registros: ~1266
con_rubro_id: ~1266
sin_rubro_id: ~0
rubros_distintos: ~7
fuentes_distintas: 2 (google_places, haby)
```

## 🔄 Mantenimiento

### Sincronización Diaria (Cron Job)

El script `sincronizar_tablas.sh` ejecuta `recrear_ll_lugares_clientes.js` que ahora incluye:

```javascript
// Sincronizar ll_societe_extended automáticamente
await conn.query(`
  INSERT INTO ll_societe_extended (societe_id, rubro_id, origen)
  SELECT s.rowid, l.rubro_id, 'google_places'
  FROM llxbx_societe s
  INNER JOIN ll_lugares l ON s.ref_ext = CONCAT('lugares_', l.id)
  WHERE l.rubro_id IS NOT NULL
  ON DUPLICATE KEY UPDATE 
    rubro_id = VALUES(rubro_id),
    origen = VALUES(origen),
    updated_at = CURRENT_TIMESTAMP
`);
```

### Post-Upgrade Dolibarr

```bash
# Verificar que ll_societe_extended sigue existiendo
mysql -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} ${DB_DATABASE} -e "SELECT COUNT(*) FROM ll_societe_extended;"

# Si existe, no hacer nada (tabla es nuestra, no de Dolibarr)
# Si no existe, re-ejecutar: scripts/crear_ll_societe_extended.sql
```

## 📁 Archivos Modificados

1. ✅ `scripts/crear_ll_societe_extended.sql` - Script de creación
2. ✅ `scripts/recrear_ll_lugares_clientes.js` - Agregada sincronización
3. ✅ `routes/envios.js` - Query actualizado con LEFT JOIN

## 🎯 Ventajas de esta Solución

1. **Arquitectura Limpia:**
   - Tabla centralizada: `llxbx_societe`
   - Extensión custom: `ll_societe_extended`
   - No modifica tablas de Dolibarr

2. **Performance:**
   - Un solo LEFT JOIN adicional
   - Índices en campos clave
   - Query eficiente

3. **Mantenibilidad:**
   - Sincronización automática en cron
   - Fácil de entender y documentar
   - Extensible a futuro

4. **Seguridad:**
   - Inmune a upgrades de Dolibarr
   - ON DELETE CASCADE mantiene integridad
   - Foreign keys validan relaciones

## 🔮 Extensiones Futuras

La tabla `ll_societe_extended` puede extenderse fácilmente:

```sql
-- Agregar más campos según necesidad
ALTER TABLE ll_societe_extended 
  ADD COLUMN zona_id INT(11) NULL AFTER rubro_id,
  ADD COLUMN rating DECIMAL(2,1) NULL AFTER zona_id,
  ADD COLUMN reviews INT(11) NULL AFTER rating,
  ADD INDEX idx_zona (zona_id),
  ADD INDEX idx_rating (rating);
```

## ✅ Checklist de Implementación

- [ ] Ejecutar `scripts/crear_ll_societe_extended.sql`
- [ ] Verificar datos con query de estadísticas
- [ ] Probar frontend: form_envios.html debe mostrar rubros
- [ ] Verificar filtro por rubro funciona
- [ ] Commit cambios a GitHub
- [ ] Deploy a Contabo
- [ ] Verificar en producción

## 🚨 Troubleshooting

**Error: Table 'll_societe_extended' doesn't exist**
```bash
# Re-ejecutar script de creación
mysql -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} -P${DB_PORT} ${DB_DATABASE} < scripts/crear_ll_societe_extended.sql
```

**Error: Column 'rubro_id' doesn't exist in 'll_lugares_haby'**
```bash
# El script lo agrega automáticamente, pero si falla:
mysql -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} -P${DB_PORT} ${DB_DATABASE} -e "
  ALTER TABLE ll_lugares_haby ADD COLUMN rubro_id INT(11) NULL;
"
```

**Rubros no se muestran en frontend**
```bash
# Verificar sincronización
node scripts/recrear_ll_lugares_clientes.js
```
