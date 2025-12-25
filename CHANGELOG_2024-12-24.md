# Changelog - 24 de Diciembre de 2024

## 🚀 Correcciones y Mejoras Implementadas

### 1. Sistema de Envío de Mensajes Corregido

**Problema identificado:**
- Los mensajes de la campaña 46 no se estaban enviando ni actualizando en la base de datos
- El sistema marcaba "enviado" en el frontend pero el estado en BD permanecía como "pendiente"

**Causa raíz:**
- La función `sendMessage()` en `bot/whatsapp_instance.js` requiere 3 parámetros: `(sessionName, telefono, mensaje)`
- El código estaba llamando solo con 2 parámetros: `(telefono, mensaje)`
- No existía el endpoint `/api/envios/enviar/:id` que el frontend estaba invocando

**Solución implementada:**

1. **`routes/enviar_manual.js`:**
   - Agregado soporte para recibir parámetro `session` desde el frontend
   - Implementada lógica para usar el cliente correcto según la sesión (haby usa `whatsapp-web.js`, otras usan `venom-bot`)
   - Corrección de llamadas a `sendMessage()` con los 3 parámetros correctos

2. **`routes/envios.js`:**
   - Creado endpoint `POST /api/envios/enviar/:id` para envío de campañas completas
   - Implementada lógica para determinar la sesión de WhatsApp desde la tabla `ll_usuarios`
   - Envío masivo con delay aleatorio de 5-15 segundos entre mensajes
   - Actualización automática de estado a "enviado" en la base de datos

3. **`public/form_envios_pendientes.js`:**
   - Agregado soporte para enviar parámetro `session` desde la URL al backend

### 2. Sesión de WhatsApp Persistente

**Problema:**
- La sesión de WhatsApp se desconectaba al reiniciar el servidor
- Era necesario escanear el QR code manualmente en cada reinicio

**Solución implementada:**

1. **`routes/haby.js`:**
   - Implementada función de auto-inicialización que detecta tokens guardados
   - Al arrancar el servidor, verifica si existe la carpeta `tokens/haby/Default`
   - Si existe, inicializa automáticamente el cliente de WhatsApp
   - Exportada función `getHabyClient()` para uso en otros módulos

2. **Integración con sistema de envíos:**
   - Modificado `routes/envios.js` para usar el cliente de WhatsApp correcto según el tipo de sesión
   - Si es sesión "haby", usa `whatsapp-web.js` directamente
   - Si es otra sesión, usa `venom-bot`

**Resultado:**
- La sesión ahora persiste entre reinicios del servidor
- Reconexión automática sin intervención manual
- Los tokens se guardan en `tokens/haby/`

### 3. Sistema de Programaciones Automáticas

**Implementado:**
- Scheduler automático que ejecuta envíos programados respetando horarios configurados

**Características:**

1. **`scheduler/programaciones-scheduler.js`:**
   - Zona horaria: America/Argentina/Buenos_Aires
   - Se ejecuta cada 5 minutos
   - Verifica programaciones con estado "aprobada"
   - Valida:
     - Día de la semana coincide con la programación
     - Hora actual dentro del rango configurado
     - Fecha actual dentro del período de envío
   - Respeta cupos diarios configurados
   - Delay aleatorio de 5-15 segundos entre envíos

2. **Proceso PM2:**
   - Iniciado como `programaciones-scheduler`
   - Reinicio automático en caso de fallos
   - Logs con timestamp para debugging

**Uso:**
- El admin configura la programación desde el panel
- Hace clic en "Aprobar"
- El sistema automáticamente envía mensajes en el horario configurado
- Respeta días de semana, horarios y cupos diarios

### 4. Corrección de Rutas y Endpoints

**Cambios realizados:**

1. **Mapeo de cliente_id a sesión:**
   - Consulta a tabla `ll_usuarios` para obtener el nombre de usuario
   - Mapeo dinámico de cliente_id a nombre de sesión de WhatsApp
   - Fallback a 'haby' si no se encuentra el cliente

2. **Endpoint de envío de campaña:**
   - Ruta: `POST /api/envios/enviar/:id`
   - Obtiene todos los mensajes pendientes de la campaña
   - Envía con la sesión correcta según el cliente
   - Actualiza estados en la base de datos
   - Retorna resumen de enviados y errores

### 5. Optimización de Procesos PM2

**Estado actual de procesos:**
- ✅ `whatsapp-massive-sender` - Servidor principal (puerto 3011)
- ✅ `programaciones-scheduler` - Scheduler de envíos automáticos
- ✅ `whatsapp-bot-responder` - Bot de respuestas automáticas
- ❌ `leadmaster-central-hub` - Eliminado (no se usaba)

## 📝 Archivos Modificados

- `routes/enviar_manual.js` - Corrección de envíos manuales
- `routes/envios.js` - Nuevo endpoint de envío de campañas
- `routes/haby.js` - Auto-inicialización de sesión persistente
- `public/form_envios_pendientes.js` - Soporte para parámetro session
- `scheduler/programaciones-scheduler.js` - Nuevo scheduler automático

## ✅ Verificación

### Pruebas realizadas:
1. ✅ Mensaje de prueba enviado correctamente al número 5491163083302
2. ✅ Estado actualizado en BD de "pendiente" a "enviado"
3. ✅ Sesión de WhatsApp persiste entre reinicios
4. ✅ Scheduler detecta programaciones fuera de horario correctamente
5. ✅ Sistema multi-cliente funcional (cliente_id 51 = Haby)

### Base de datos:
```sql
-- Verificar envíos
SELECT id, estado, fecha_envio FROM ll_envios_whatsapp WHERE id = 2933;
-- Resultado: enviado | 2025-12-24 17:30:10

-- Verificar usuarios
SELECT id, usuario, cliente_id FROM ll_usuarios WHERE cliente_id = 51;
-- Resultado: Haby | 51
```

## 🔧 Configuración Técnica

### Variables de entorno (.env):
```
PORT=3011
DB_HOST=sv46.byethost46.org
DB_USER=iunaorg_b3toh
DB_PASSWORD=elgeneral2018
DB_DATABASE=iunaorg_dyd
SESSION_SECRET=<secret>
REDIS_URL=redis://localhost:6379
TZ=America/Argentina/Buenos_Aires
```

### Dependencias agregadas:
- `axios` - Para llamadas HTTP del scheduler

## 🎯 Próximos Pasos Sugeridos

1. Crear más clientes además de Haby
2. Implementar panel de monitoreo en tiempo real
3. Agregar métricas de envío (tasa de éxito, errores, etc.)
4. Implementar límites de rate para evitar bloqueos de WhatsApp
5. Agregar notificaciones cuando una campaña termine de enviarse

## 📊 Resumen de Impacto

- **Problema resuelto:** Sistema de envíos ahora funciona correctamente
- **Sesión persistente:** Ahorra tiempo y elimina intervención manual
- **Envíos automáticos:** Respeta horarios comerciales y cupos
- **Multi-cliente:** Base para escalar a múltiples clientes
- **Confiabilidad:** Procesos monitoreados con PM2
