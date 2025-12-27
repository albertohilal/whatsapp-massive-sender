# Bot de Respuestas Automáticas - Configuración y Control

## Descripción General

Sistema que permite activar/desactivar las respuestas automáticas del bot de IA desde el panel del cliente. El bot puede operar en dos modos:

- **🔇 Solo Escucha**: Registra mensajes entrantes en la BD sin responder
- **🤖 Activo**: Responde automáticamente usando IA (ChatGPT)

## Arquitectura

### Base de Datos

**Tabla: `ll_bot_config`**
```sql
CREATE TABLE IF NOT EXISTS `ll_bot_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `bot_activo` tinyint(1) DEFAULT 0 COMMENT '0=Solo escucha, 1=Responde automáticamente',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cliente` (`cliente_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
```

**Ubicación script SQL:** `/root/whatsapp-massive-sender/db/ll_bot_config.sql`

### Backend API

**Archivo:** `/root/whatsapp-massive-sender/routes/bot-config.js`

#### Endpoints:

1. **GET `/api/bot-config/status/:clienteId`**
   - Consulta el estado actual del bot para un cliente
   - Respuesta: `{ bot_activo: 0|1, updated_at: timestamp }`

2. **POST `/api/bot-config/toggle/:clienteId`**
   - Activa o desactiva el bot
   - Body: `{ bot_activo: 0|1 }`
   - Respuesta: `{ success: true, bot_activo: 0|1, mensaje: "..." }`

### Lógica del Bot Responder

**Archivo:** `/root/whatsapp-bot-responder/index.js`

**Flujo de procesamiento:**

1. Mensaje entrante se recibe en `/api/message-received`
2. Se guarda el mensaje del usuario en `ll_ia_conversaciones`
3. Se consulta `ll_bot_config` para el `cliente_id` correspondiente
4. **Si `bot_activo = 0`**: Solo registra, no responde
5. **Si `bot_activo = 1`**: 
   - Obtiene historial de conversación
   - Genera respuesta con IA (ChatGPT)
   - Guarda respuesta en BD
   - Envía mensaje por WhatsApp

### Frontend - Panel del Cliente

**Archivo UI:** `/root/whatsapp-massive-sender/public/haby/dashboard.html`
**Archivo JS:** `/root/whatsapp-massive-sender/public/haby/dashboard_haby.js`
**Estilos:** `/root/whatsapp-massive-sender/public/habysupply/style.css`

#### Componente Toggle

```html
<section class="card">
  <h2>Respuestas Automáticas (Bot IA)</h2>
  <p class="muted">Activa o desactiva las respuestas automáticas del bot.</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <label>Estado del Bot:</label>
    <label class="toggle-switch">
      <input type="checkbox" id="bot-toggle">
      <span class="toggle-slider"></span>
    </label>
    <span id="bot-status-text">Cargando...</span>
  </div>
</section>
```

## Instalación

### 1. Crear la tabla en la base de datos

```bash
cd /root/whatsapp-massive-sender
mysql -u root -p iunaorg_dyd < db/ll_bot_config.sql
```

### 2. Verificar que los servicios están corriendo

```bash
pm2 list
```

Deberías ver:
- `whatsapp-massive-sender` (puerto 3011)
- `whatsapp-bot-responder` (puerto 3013)

### 3. Reiniciar servicios para aplicar cambios

```bash
pm2 restart whatsapp-massive-sender
pm2 restart whatsapp-bot-responder
```

## Uso desde el Panel

1. **Acceder al dashboard de Haby:**
   - URL: `http://massive.desarrolloydisenioweb.com.ar/haby/dashboard.html`
   - Iniciar sesión con credenciales del cliente

2. **Sección "Respuestas Automáticas (Bot IA)":**
   - Ver el estado actual del bot
   - Usar el toggle switch para activar/desactivar
   - Estado se actualiza inmediatamente

3. **Estados visuales:**
   - 🔇 **Solo Escucha** (gris) - Bot desactivado
   - 🤖 **Activo** (verde) - Bot respondiendo automáticamente

## Configuración por Cliente

Por defecto, **Haby (cliente_id: 51)** está configurado en modo **"Solo Escucha"** (bot_activo = 0).

Para configurar otros clientes:

```sql
-- Insertar configuración para un nuevo cliente
INSERT INTO ll_bot_config (cliente_id, bot_activo) 
VALUES (52, 0)  -- 0 = Solo escucha, 1 = Activo
ON DUPLICATE KEY UPDATE bot_activo = 0;
```

## Logs y Monitoreo

### Logs del Bot Responder

```bash
pm2 logs whatsapp-bot-responder
```

**Mensajes clave:**
- `✅ Mensaje registrado de [teléfono] (cliente: 51)` - Mensaje guardado
- `🔇 Bot en MODO SOLO ESCUCHA para cliente 51 - No se envía respuesta` - Bot desactivado
- `🤖 Bot ACTIVO para cliente 51 - Generando respuesta...` - Bot respondiendo
- `✅ Respuesta enviada a [teléfono] (cliente: 51)` - Respuesta enviada exitosamente

### Dashboard de Conversaciones

URL: `http://responder.desarrolloydisenioweb.com.ar/conversaciones.html`

- Ver todas las conversaciones en tiempo real
- Filtrar por teléfono o cliente
- Ver mensajes entrantes (user) y respuestas (assistant)

## Tablas Relacionadas

### `ll_ia_conversaciones`
Almacena todas las conversaciones (mensajes entrantes y respuestas del bot):

```sql
CREATE TABLE `ll_ia_conversaciones` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) DEFAULT 51,
  `telefono` varchar(20) NOT NULL,
  `rol` enum('user','assistant') NOT NULL,
  `origen_mensaje` enum('ia','humano','sistema') DEFAULT 'ia',
  `pauso_ia` tinyint(1) DEFAULT 0,
  `mensaje` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

### `ll_envios_whatsapp`
Almacena los mensajes salientes de campañas masivas:

```sql
CREATE TABLE `ll_envios_whatsapp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `campania_id` int(11) NOT NULL,
  `telefono_wapp` varchar(255),
  `nombre_destino` varchar(255),
  `mensaje_final` text,
  `estado` enum('pendiente','enviado','error'),
  `fecha_envio` datetime,
  `lugar_id` int(11),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
```

## Troubleshooting

### El toggle no cambia de estado

1. Verificar que la tabla `ll_bot_config` existe:
   ```sql
   SHOW TABLES LIKE 'll_bot_config';
   ```

2. Verificar logs del backend:
   ```bash
   pm2 logs whatsapp-massive-sender --lines 50
   ```

3. Verificar permisos de autenticación en el panel

### El bot no responde aunque esté activo

1. Verificar estado en la BD:
   ```sql
   SELECT * FROM ll_bot_config WHERE cliente_id = 51;
   ```

2. Verificar que el bot responder está corriendo:
   ```bash
   pm2 status whatsapp-bot-responder
   ```

3. Revisar logs del bot:
   ```bash
   pm2 logs whatsapp-bot-responder --lines 100
   ```

4. Verificar que la API de OpenAI está configurada:
   ```bash
   cat /root/whatsapp-bot-responder/.env | grep OPENAI
   ```

### El bot responde aunque esté desactivado

1. Verificar que el código del bot está actualizado:
   ```bash
   cd /root/whatsapp-bot-responder
   grep -A 5 "bot_activo" index.js
   ```

2. Reiniciar el servicio:
   ```bash
   pm2 restart whatsapp-bot-responder
   ```

## Integración con leadmaster-central-hub

Este sistema legacy será migrado al proyecto unificado `/root/leadmaster-central-hub` en el futuro. La arquitectura modular actual facilita la migración:

- **Session Manager**: Control centralizado de WhatsApp
- **Listener Module**: Manejo de mensajes entrantes
- **Sender Module**: Envíos masivos
- **Auth Module**: Autenticación multi-cliente

## Notas de Seguridad

- ✅ Endpoints protegidos con autenticación JWT (`requireAuth`)
- ✅ Configuración aislada por `cliente_id`
- ✅ Validación de parámetros (`bot_activo` debe ser 0 o 1)
- ✅ Logs detallados para auditoría

## Changelog

### 2025-12-27
- ✅ Implementada tabla `ll_bot_config`
- ✅ Creados endpoints API para control de bot
- ✅ Integrada lógica de consulta en bot responder
- ✅ Agregado toggle UI en dashboard de Haby
- ✅ Sistema configurado en modo "Solo Escucha" por defecto
