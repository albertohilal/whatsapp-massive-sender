# Informe de Sincronización de Tablas

## Tablas involucradas
- `ll_lugares`: Leads obtenidos por scraping.
- `ll_lugares_haby`: Leads provenientes de Haby.
- `llxbx_societe`: Tabla centralizada de empresas/clientes, con campo `ref_ext` para trazabilidad.
- `ll_lugares_clientes`: Tabla normalizada de vinculación entre leads y clientes, con los campos `societe_id`, `ref_ext`, `cliente_id`.

## Lógica de Sincronización
- Cada lead con teléfono válido en `ll_lugares` y `ll_lugares_haby` debe tener su correspondiente registro en `llxbx_societe` usando `ref_ext` (`lugares_{$id}` o `haby_{$id}`).
- La tabla `ll_lugares_clientes` se repuebla desde cero, asegurando que:
  - Los leads scraping (`lugares_{$id}`) se vinculan según el rango de `id` y la lógica de `cliente_id` (<=1717: 52, >=1721: 51, 1718/1719: ambos).
  - Los leads Haby (`haby_{$id}`) se vinculan siempre con ambos `cliente_id` (51 y 52).
- No se insertan registros en `ll_lugares_clientes` si el `ref_ext` no existe en `llxbx_societe`.

## Diagnóstico Final
Se ejecutó el script `diagnostico_sincronizacion.js` para validar la sincronización. Resultados:

### 1. Leads scraping sin `ref_ext` en `llxbx_societe`
- Se detectaron varios leads de scraping recientes sin registro en `llxbx_societe` (ejemplo: "1950 Tattoo Shop", "Nito Wan Tattoo", etc.).

### 2. Leads Haby sin `ref_ext` en `llxbx_societe`
- OK. Todos los leads Haby están correctamente vinculados.

### 3. `ref_ext` en `ll_lugares_clientes` que no existen en `llxbx_societe`
- OK. No hay registros huérfanos.

### 4. Duplicados de `ref_ext` en `llxbx_societe`
- Solo se detectó duplicado para el caso especial `haby_23`.

### 5. Duplicados de `ref_ext` y `cliente_id` en `ll_lugares_clientes`
- Solo se detectó duplicado para `haby_23` con ambos `cliente_id`.

### 6. Leads scraping válidos sin representación en `ll_lugares_clientes`
- Coinciden con los que faltan en `llxbx_societe`.

### 7. Leads Haby válidos sin representación en `ll_lugares_clientes`
- OK. Todos los leads Haby están representados.

## Conclusiones
- La sincronización y trazabilidad entre las tablas es correcta para los leads Haby y para los leads scraping que tienen su `ref_ext` en `llxbx_societe`.
- Los únicos casos pendientes son los leads scraping recientes que aún no tienen registro en `llxbx_societe`.
- No existen registros huérfanos ni duplicados relevantes, salvo el caso especial de `haby_23`.

## Recomendaciones
- Insertar los leads scraping faltantes en `llxbx_societe` para completar la sincronización.
- Mantener este diagnóstico como checklist para futuras auditorías y validaciones.

---

_Este informe documenta el estado y la lógica de sincronización de las tablas, así como los resultados del diagnóstico final._
