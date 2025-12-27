# Integración Bot Responder - Cliente WhatsApp Compartido

**Fecha:** 25 de Diciembre de 2025

## 🎯 Objetivo

Unificar la conexión WhatsApp entre `whatsapp-massive-sender` y `whatsapp-bot-responder` para:
- Evitar doble conexión al mismo número de WhatsApp
- Compartir tokens de autenticación
- Reducir consumo de recursos
- Simplificar mantenimiento

## 📋 Problema Anterior

### Arquitectura dual (problemática):
```
whatsapp-massive-sender     whatsapp-bot-responder
    ↓                           ↓
whatsapp-web.js            venom-bot
    ↓                           ↓
tokens/haby/            tokens/whatsapp-bot-responder/
    ↓                           ↓
  WhatsApp ← MISMO NÚMERO → WhatsApp
```

**Problemas:**
- Dos conexiones simultáneas al mismo número
- Tokens duplicados e inconsistentes
- Mayor consumo de memoria (2 instancias de Chrome)
- Conflictos de sincronización
- Mantenimiento de 2 librerías diferentes

## ✅ Solución Implementada

### Nueva arquitectura unificada:
```
whatsapp-massive-sender (FUENTE ÚNICA)
    ↓
whatsapp-web.js + LocalAuth
    ↓
tokens/haby/Default
    ↓
  WhatsApp
    ↑
    │ (API REST)
    ↓
whatsapp-bot-responder (CONSUMIDOR)
```

## 🔧 Componentes Creados

### 1. Sistema de Listeners en massive-sender

**Archivo:** `routes/whatsapp-listener.js`

#### Endpoints creados:

##### POST `/api/whatsapp/register-listener`
Registra un servicio para recibir notificaciones de mensajes entrantes.

**Request:**
```json
{
  "callbackUrl": "http://localhost:3013/api/message-received"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Listener registrado correctamente",
  "totalListeners": 1
}
```

##### POST `/api/whatsapp/unregister-listener`
Remueve un listener registrado.

**Request:**
```json
{
  "callbackUrl": "http://localhost:3013/api/message-received"
}
```

##### POST `/api/whatsapp/send`
Envía mensajes a través del cliente compartido.

**Request:**
```json
{
  "to": "5491163083302@c.us",
  "message": "Hola desde bot responder"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mensaje enviado correctamente",
  "to": "5491163083302@c.us"
}
```

##### GET `/api/whatsapp/status`
Obtiene el estado de la conexión WhatsApp.

**Response:**
```json
{
  "connected": true,
  "state": "CONNECTED",
  "listeners": 1
}
```

#### Funcionamiento interno:

1. **Registro de listeners:**
   - Los servicios se registran con su URL de callback
   - Se mantienen en un `Set()` en memoria

2. **Captura de mensajes:**
   - El cliente WhatsApp emite eventos `message`
   - Se notifica a todos los listeners registrados vía POST

3. **Notificación webhook:**
```javascript
{
  "from": "5491163083302@c.us",
  "body": "Hola, necesito ayuda",
  "timestamp": 1735097234,
  "type": "chat",
  "id": "true_5491163083302@c.us_..."
}
```

### 2. Cliente Compartido en bot-responder

**Archivo:** `bot/whatsapp-client.js`

#### Clase SharedWhatsAppClient:

```javascript
class SharedWhatsAppClient {
  async initialize()      // Registra el listener
  async sendMessage()     // Envía mensajes
  async getStatus()       // Obtiene estado
  async destroy()         // Limpieza al cerrar
}
```

#### Variables de entorno necesarias:

```env
MASSIVE_SENDER_URL=http://localhost:3011
RESPONDER_CALLBACK_URL=http://localhost:3013/api/message-received
PORT=3013
```

### 3. Modificaciones en index.js (bot-responder)

**Antes:**
```javascript
require('./bot/whatsapp'); // Iniciaba venom-bot
```

**Después:**
```javascript
const whatsappClient = require('./bot/whatsapp-client');

// Endpoint para recibir mensajes
app.post('/api/message-received', async (req, res) => {
  const { from, body, type } = req.body;
  
  // Procesar mensaje
  // Generar respuesta con IA
  // Enviar respuesta vía whatsappClient.sendMessage()
});

// Inicializar cliente compartido
whatsappClient.initialize();
```

## 📊 Flujo de Mensajes

### Mensaje entrante:
```
WhatsApp
  ↓
massive-sender (cliente whatsapp-web.js)
  ↓
Event 'message'
  ↓
notifyListeners()
  ↓
POST http://localhost:3013/api/message-received
  ↓
bot-responder procesa y responde
```

### Respuesta del bot:
```
bot-responder
  ↓
POST http://localhost:3011/api/whatsapp/send
  ↓
massive-sender (cliente whatsapp-web.js)
  ↓
client.sendMessage()
  ↓
WhatsApp
```

## 🌐 Configuración Nginx

**Archivo:** `/etc/nginx/sites-available/responder`

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name responder.desarrolloydisenioweb.com.ar;

    location / {
        proxy_pass http://localhost:3013;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    ssl_certificate /etc/letsencrypt/live/responder.../fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/responder.../privkey.pem;
}
```

## 📦 Dependencias

### whatsapp-massive-sender:
- `whatsapp-web.js` - Cliente WhatsApp
- `express` - Servidor web
- `axios` - HTTP client (para notificaciones)

### whatsapp-bot-responder:
- `axios` - HTTP client (para llamadas a massive-sender)
- `express` - Servidor web
- ~~`venom-bot`~~ - **REMOVIDO**

## 🔄 Proceso de Migración

### 1. Detener bot antiguo:
```bash
pm2 stop whatsapp-bot-responder
```

### 2. Backup de tokens:
```bash
mv /root/whatsapp-bot-responder/tokens /root/whatsapp-bot-responder/tokens.backup
```

### 3. Actualizar código:
```bash
cd /root/whatsapp-massive-sender
git pull origin main

cd /root/whatsapp-bot-responder
git pull origin main
```

### 4. Instalar dependencias:
```bash
cd /root/whatsapp-bot-responder
npm install axios
```

### 5. Actualizar .env:
```bash
# bot-responder/.env
PORT=3013
MASSIVE_SENDER_URL=http://localhost:3011
RESPONDER_CALLBACK_URL=http://localhost:3013/api/message-received
```

### 6. Reiniciar servicios:
```bash
pm2 restart whatsapp-massive-sender
pm2 restart whatsapp-bot-responder
pm2 save
```

## 📈 Beneficios Obtenidos

### Consumo de recursos:

**Antes:**
- massive-sender: ~130 MB
- bot-responder: ~100 MB (venom-bot + Chrome)
- **Total: ~230 MB**

**Después:**
- massive-sender: ~176 MB (cliente único)
- bot-responder: ~20 MB (solo API)
- **Total: ~196 MB** ✅ **-15% memoria**

### Arquitectura:
- ✅ Una sola conexión WhatsApp
- ✅ Tokens centralizados en `tokens/haby/`
- ✅ Una sola librería (whatsapp-web.js)
- ✅ Fácil escalabilidad (agregar más consumidores)

### Mantenimiento:
- ✅ Un solo punto de autenticación
- ✅ Logs centralizados en massive-sender
- ✅ Actualizaciones solo en un lugar
- ✅ Debugging simplificado

## 🧪 Verificación

### 1. Estado de conexión:
```bash
curl http://localhost:3013/api/status
```

Respuesta esperada:
```json
{
  "whatsapp": {
    "connected": true,
    "state": "CONNECTED",
    "listeners": 1
  }
}
```

### 2. Listeners registrados:
```bash
curl http://localhost:3011/api/whatsapp/status
```

Respuesta esperada:
```json
{
  "connected": true,
  "listeners": 1
}
```

### 3. Logs de massive-sender:
```bash
pm2 logs whatsapp-massive-sender --lines 20
```

Buscar:
```
📡 Listener registrado: http://localhost:3013/api/message-received
✅ Message listener configurado
```

### 4. Logs de bot-responder:
```bash
pm2 logs whatsapp-bot-responder --lines 20
```

Buscar:
```
✅ Bot responder registrado como listener en massive-sender
📡 Callback URL: http://localhost:3013/api/message-received
```

## 🚨 Troubleshooting

### El bot no recibe mensajes:

1. Verificar que el listener esté registrado:
```bash
curl http://localhost:3011/api/whatsapp/status
```

2. Verificar que massive-sender tenga el cliente conectado:
```bash
curl http://localhost:3011/haby/api/wapp-session/status
```

3. Reiniciar el bot-responder:
```bash
pm2 restart whatsapp-bot-responder
```

### Error "Cliente de WhatsApp no está conectado":

1. Verificar sesión en massive-sender:
```bash
ls -la /root/whatsapp-massive-sender/tokens/haby/Default/
```

2. Si no existe, inicializar sesión:
```bash
curl -X POST http://localhost:3011/haby/api/wapp-session/init
```

3. Esperar 10-15 segundos para reconexión automática

### Puerto 3013 ya en uso:

```bash
# Ver qué proceso usa el puerto
lsof -i :3013

# Matar proceso si es necesario
pm2 delete whatsapp-bot-responder
pm2 start ecosystem.config.js --only whatsapp-bot-responder
```

## 🔐 Seguridad

### Consideraciones:

1. **URLs internas:** Los endpoints de integración son `localhost` solamente
2. **Sin autenticación:** El tráfico es interno al servidor
3. **Para producción:** Considerar agregar tokens de autenticación

Ejemplo de autenticación opcional:
```javascript
// massive-sender/routes/whatsapp-listener.js
const INTEGRATION_TOKEN = process.env.INTEGRATION_TOKEN;

router.post('/api/whatsapp/register-listener', (req, res) => {
  if (req.headers.authorization !== `Bearer ${INTEGRATION_TOKEN}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  // ... resto del código
});
```

## 📚 Referencias

- Repositorio massive-sender: https://github.com/albertohilal/whatsapp-massive-sender
- Repositorio bot-responder: https://github.com/albertohilal/whatsapp-bot-responder
- Documentación whatsapp-web.js: https://docs.wwebjs.dev/

## 📝 Commits Relacionados

- massive-sender: `dd87b0d` - "feat: Cliente WhatsApp compartido"
- bot-responder: `91cd879` - "feat: Migrado a cliente compartido"

## 🎯 Próximos Pasos

1. ✅ Implementar autenticación entre servicios (opcional)
2. ✅ Crear dashboard web para bot-responder
3. ✅ Agregar métricas de mensajes procesados
4. ✅ Implementar rate limiting
5. ✅ Agregar más consumidores (ej: notificaciones, analytics)

---

**Autor:** Sistema integrado whatsapp-massive-sender + whatsapp-bot-responder  
**Última actualización:** 25 de Diciembre de 2025
