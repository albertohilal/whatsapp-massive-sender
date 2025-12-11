# Impacto de Upgrades de Dolibarr en Campos Custom

## ⚠️ Problema Identificado

Al agregar columnas custom directamente a tablas core de Dolibarr (como `llxbx_societe`), existe el riesgo de que un **upgrade de Dolibarr** pueda:

1. **Sobrescribir** la tabla con estructura original
2. **Eliminar** columnas que no están en el schema oficial
3. **Fallar** el upgrade por diferencias en estructura

## 🔍 Comportamiento de Dolibarr en Upgrades

### Según documentación de Dolibarr:

**Tablas Core (`llxbx_*`):**
- El proceso de upgrade compara estructura actual vs schema oficial
- Las columnas NO documentadas **generalmente se mantienen**
- Dolibarr usa `ALTER TABLE ADD COLUMN IF NOT EXISTS` para agregar nuevas columnas
- **NO elimina** columnas que no reconoce (para evitar pérdida de datos)

**Campo `ref_ext` como precedente:**
- `ref_ext` está diseñado específicamente para uso externo
- La documentación dice: *"You can use it to store your id of thirdparty into another external system. This will help synchronisation tools."*
- Este campo **sí está en el schema oficial** de Dolibarr

## ✅ Soluciones Seguras

### Opción 1: Usar Extrafields (Recomendado por Dolibarr)

**Ventajas:**
- ✅ Oficialmente soportado por Dolibarr
- ✅ Sobrevive a upgrades automáticamente
- ✅ Manejable desde la interfaz de Dolibarr
- ✅ Respaldado/restaurado en migraciones

**Desventajas:**
- ❌ Requiere JOIN adicional en cada query
- ❌ Rendimiento ligeramente inferior

**Implementación:**
```sql
-- 1. Definir el extrafield en llxbx_extrafields
INSERT INTO llxbx_extrafields (
  name, label, type, elementtype, entity, size, pos
) VALUES (
  'rubro_id', 'Rubro', 'int', 'societe', 1, 11, 100
);

-- 2. Crear tabla de valores si no existe
CREATE TABLE IF NOT EXISTS llxbx_societe_extrafields (
  rowid INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  fk_object INT(11) NOT NULL,
  rubro_id INT(11) NULL,
  import_key VARCHAR(14) NULL,
  UNIQUE KEY uk_societe_extrafields (fk_object),
  KEY idx_societe_extrafields_rubro (rubro_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Sincronizar datos
INSERT INTO llxbx_societe_extrafields (fk_object, rubro_id)
SELECT s.rowid, l.rubro_id
FROM llxbx_societe s
INNER JOIN ll_lugares l ON s.ref_ext = CONCAT('lugares_', l.id)
WHERE l.rubro_id IS NOT NULL
ON DUPLICATE KEY UPDATE rubro_id = VALUES(rubro_id);

-- 4. Consulta con extrafield
SELECT 
  s.rowid AS id,
  s.nom AS nombre,
  s.address AS direccion,
  s.phone_mobile AS telefono_wapp,
  COALESCE(r.nombre, 'Sin rubro') AS rubro
FROM llxbx_societe s
INNER JOIN ll_lugares_clientes lc ON lc.societe_id = s.rowid
LEFT JOIN llxbx_societe_extrafields se ON se.fk_object = s.rowid
LEFT JOIN ll_rubros r ON se.rubro_id = r.id
WHERE lc.cliente_id = ?
```

### Opción 2: Columna Custom con Backup (Medio Riesgo)

**Proceso:**
```bash
# Antes de cada upgrade de Dolibarr:
# 1. Backup de estructura y datos
mysqldump -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} \
  --no-data ${DB_DATABASE} llxbx_societe > backup_societe_schema.sql

mysqldump -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} \
  --no-create-info ${DB_DATABASE} llxbx_societe --where="rubro_id IS NOT NULL" > backup_societe_rubro.sql

# 2. Upgrade Dolibarr

# 3. Verificar si columna sobrevivió
mysql -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} ${DB_DATABASE} \
  -e "SHOW COLUMNS FROM llxbx_societe LIKE 'rubro_id';"

# 4. Si fue eliminada, re-agregar
mysql -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} ${DB_DATABASE} \
  < scripts/agregar_rubro_societe.sql
```

### Opción 3: Tabla Intermedia Custom (Más Seguro)

**Crear tabla propia fuera del namespace de Dolibarr:**

```sql
-- Tabla NO usa prefijo llxbx_ (es nuestra, no de Dolibarr)
CREATE TABLE ll_societe_extended (
  societe_id INT(11) NOT NULL PRIMARY KEY,
  rubro_id INT(11) NULL,
  -- Agregar otros campos custom aquí
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rubro (rubro_id),
  FOREIGN KEY (societe_id) REFERENCES llxbx_societe(rowid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sincronizar
INSERT INTO ll_societe_extended (societe_id, rubro_id)
SELECT s.rowid, l.rubro_id
FROM llxbx_societe s
INNER JOIN ll_lugares l ON s.ref_ext = CONCAT('lugares_', l.id)
WHERE l.rubro_id IS NOT NULL
ON DUPLICATE KEY UPDATE rubro_id = VALUES(rubro_id);

-- Consulta
SELECT 
  s.rowid AS id,
  s.nom AS nombre,
  s.phone_mobile AS telefono_wapp,
  COALESCE(r.nombre, 'Sin rubro') AS rubro
FROM llxbx_societe s
INNER JOIN ll_lugares_clientes lc ON lc.societe_id = s.rowid
LEFT JOIN ll_societe_extended se ON se.societe_id = s.rowid
LEFT JOIN ll_rubros r ON se.rubro_id = r.id
WHERE lc.cliente_id = ?
```

**Ventajas:**
- ✅ Totalmente inmune a upgrades de Dolibarr
- ✅ Estructura completamente bajo nuestro control
- ✅ Fácil de respaldar y mantener
- ✅ ON DELETE CASCADE mantiene integridad

**Desventajas:**
- ❌ Requiere JOIN adicional (como extrafields)
- ❌ Necesita lógica de sincronización

## 🎯 Recomendación Final

**OPCIÓN 3: Tabla Intermedia Custom `ll_societe_extended`**

**Razones:**
1. ✅ **Completamente seguro** ante upgrades de Dolibarr
2. ✅ **Flexible** - podemos agregar más campos custom en el futuro
3. ✅ **Consistente** con nuestra arquitectura (tablas `ll_*`)
4. ✅ **Performance aceptable** - un JOIN adicional es manejable
5. ✅ **Mantenible** - fácil de entender y documentar

## 📝 Plan de Implementación

1. Crear tabla `ll_societe_extended`
2. Poblar con datos de `ll_lugares.rubro_id`
3. Actualizar consultas en `routes/envios.js`
4. Agregar sincronización a `recrear_ll_lugares_clientes.js`
5. Agregar a cron job de sincronización
6. Documentar en README

## ⚠️ Si ya ejecutaste ALTER TABLE en llxbx_societe

```sql
-- Migrar datos a tabla nueva
INSERT INTO ll_societe_extended (societe_id, rubro_id)
SELECT rowid, rubro_id FROM llxbx_societe WHERE rubro_id IS NOT NULL;

-- Eliminar columna de llxbx_societe (opcional, para limpieza)
ALTER TABLE llxbx_societe DROP COLUMN rubro_id;
```

## 🔄 Mantenimiento Post-Upgrade

```bash
# Script post-upgrade de Dolibarr
#!/bin/bash
# scripts/post_upgrade_dolibarr.sh

echo "Verificando integridad después de upgrade Dolibarr..."

# Verificar que ll_societe_extended existe
mysql -u${DB_USER} -p${DB_PASSWORD} -h${DB_HOST} ${DB_DATABASE} \
  -e "SELECT COUNT(*) FROM ll_societe_extended;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Tabla ll_societe_extended OK"
else
  echo "❌ ERROR: Tabla ll_societe_extended no existe"
  exit 1
fi

# Re-sincronizar por si acaso
node scripts/sincronizar_rubro_societe.js

echo "✅ Post-upgrade completo"
```
