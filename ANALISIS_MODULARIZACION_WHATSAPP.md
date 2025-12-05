# 📋 Análisis de Modularización WhatsApp

**Fecha:** 5 de diciembre de 2025  
**Objetivo:** Separar la lógica de WhatsApp en módulos independientes y escalables

---

## 🔍 Situación Actual

### Problemas Identificados

1. **❌ Código Duplicado**
   - `bot/whatsapp_instance.js` (Venom-bot) vs `routes/haby.js` (whatsapp-web.js)
   - Dos implementaciones diferentes para el mismo propósito
   - Lógica de conexión mezclada con rutas

2. **❌ Falta de Separación de Responsabilidades**
   - Rutas manejando conexiones directamente
   - Controllers llamando funciones de envío sin abstracción
   - No hay un módulo centralizado de escucha de mensajes

3. **❌ Difícil Escalabilidad**
   - Agregar un nuevo cliente requiere modificar múltiples archivos
   - No hay interfaz unificada para diferentes clientes
   - Gestión de sesiones dispersa

4. **❌ Testing Complicado**
   - Dependencias acopladas
   - No se pueden hacer mocks fácilmente
   - Difícil probar cada funcionalidad por separado

### Arquitectura Actual

```
┌─────────────────────────────────────────────────────────┐
│                    routes/haby.js                       │
│  - Crea cliente whatsapp-web.js                         │
│  - Maneja QR, auth, ready                               │
│  - Expone endpoints de sesión                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              bot/whatsapp_instance.js                   │
│  - Crea clientes venom-bot                              │
│  - sendMessage()                                        │
│  - getCliente()                                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│          controllers/enviar_masivo.js                   │
│  - Obtiene registros de BD                              │
│  - Llama enviarMensaje() directamente                   │
└─────────────────────────────────────────────────────────┘
```

**Problemas:**
- ❌ Dos librerías diferentes (venom-bot, whatsapp-web.js)
- ❌ Lógica dispersa en routes, controllers, bot
- ❌ No hay módulo de escucha centralizado
- ❌ Difícil mantener múltiples clientes

---

## 🎯 Arquitectura Propuesta

### Módulos Principales

```
modules/whatsapp/
├── connection/
│   ├── ConnectionManager.js       # 🔌 Gestión de conexiones
│   ├── SessionStore.js            # 💾 Almacenamiento de sesiones
│   ├── QRCodeHandler.js           # 📱 Manejo de QR codes
│   └── AuthHandler.js             # 🔐 Autenticación
│
├── sender/
│   ├── MessageSender.js           # ✉️ Envío de mensajes
│   ├── BulkSender.js              # 📤 Envío masivo
│   ├── MessageQueue.js            # 📋 Cola de mensajes
│   └── RateLimiter.js             # ⏱️ Control de velocidad
│
├── listener/
│   ├── MessageListener.js         # 👂 Escucha de mensajes
│   ├── EventHandler.js            # 🎯 Manejo de eventos
│   ├── CommandParser.js           # 🤖 Parser de comandos
│   └── ResponseHandler.js         # 💬 Respuestas automáticas
│
├── adapters/
│   ├── WhatsAppWebAdapter.js      # Adaptador whatsapp-web.js
│   └── VenomBotAdapter.js         # Adaptador venom-bot
│
└── WhatsAppService.js             # 🎛️ Servicio principal unificado
```

---

## 🔌 Módulo 1: Connection Manager

### Responsabilidades

- ✅ Crear y gestionar conexiones WhatsApp
- ✅ Mantener múltiples sesiones simultáneas
- ✅ Manejar reconexiones automáticas
- ✅ Almacenar estado de cada sesión
- ✅ Generar y servir QR codes

### Ejemplo de Implementación

```javascript
// modules/whatsapp/connection/ConnectionManager.js

class ConnectionManager {
  constructor() {
    this.connections = new Map(); // sessionId -> connection
    this.adapter = null; // WhatsAppWebAdapter o VenomBotAdapter
  }

  /**
   * Crear una nueva conexión
   * @param {string} sessionId - ID único de la sesión (ej: 'haby', 'marketing')
   * @param {Object} options - Opciones de configuración
   */
  async createConnection(sessionId, options = {}) {
    if (this.connections.has(sessionId)) {
      throw new Error(`Sesión ${sessionId} ya existe`);
    }

    const connection = {
      id: sessionId,
      status: 'initializing',
      client: null,
      qrCode: null,
      lastActivity: new Date(),
      events: new EventEmitter()
    };

    this.connections.set(sessionId, connection);

    try {
      // Usar adaptador para crear cliente
      connection.client = await this.adapter.createClient(sessionId, options);
      
      // Configurar eventos
      this.setupEventHandlers(connection);
      
      return connection;
    } catch (error) {
      this.connections.delete(sessionId);
      throw error;
    }
  }

  /**
   * Obtener conexión existente
   */
  getConnection(sessionId) {
    return this.connections.get(sessionId);
  }

  /**
   * Verificar si sesión está activa
   */
  isConnected(sessionId) {
    const conn = this.connections.get(sessionId);
    return conn && conn.status === 'connected';
  }

  /**
   * Cerrar conexión
   */
  async closeConnection(sessionId) {
    const conn = this.connections.get(sessionId);
    if (!conn) return;

    await conn.client?.destroy();
    this.connections.delete(sessionId);
  }

  /**
   * Configurar handlers de eventos
   */
  setupEventHandlers(connection) {
    const { client, events } = connection;

    client.on('qr', (qr) => {
      connection.qrCode = qr;
      connection.status = 'qr_generated';
      events.emit('qr', qr);
    });

    client.on('ready', () => {
      connection.status = 'connected';
      connection.qrCode = null;
      events.emit('ready');
    });

    client.on('disconnected', (reason) => {
      connection.status = 'disconnected';
      events.emit('disconnected', reason);
    });

    client.on('authenticated', () => {
      connection.status = 'authenticated';
      events.emit('authenticated');
    });
  }

  /**
   * Obtener todas las conexiones activas
   */
  getActiveConnections() {
    return Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected');
  }
}

module.exports = ConnectionManager;
```

### Beneficios

✅ **Centralización**: Toda la lógica de conexión en un solo lugar  
✅ **Escalabilidad**: Agregar nuevos clientes sin modificar código existente  
✅ **Observabilidad**: Eventos para monitorear estado de conexiones  
✅ **Mantenibilidad**: Cambiar implementación sin afectar otros módulos

---

## ✉️ Módulo 2: Message Sender

### Responsabilidades

- ✅ Enviar mensajes individuales
- ✅ Envío masivo con rate limiting
- ✅ Cola de mensajes con prioridades
- ✅ Reintentos automáticos
- ✅ Tracking de envíos

### Ejemplo de Implementación

```javascript
// modules/whatsapp/sender/MessageSender.js

class MessageSender {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
    this.rateLimiter = new RateLimiter({
      maxMessagesPerMinute: 20, // Anti-ban
      delayBetweenMessages: 3000 // 3 segundos entre mensajes
    });
  }

  /**
   * Enviar un mensaje individual
   * @param {string} sessionId - ID de la sesión
   * @param {string} phoneNumber - Número de teléfono
   * @param {string} message - Mensaje a enviar
   */
  async sendMessage(sessionId, phoneNumber, message) {
    const connection = this.connectionManager.getConnection(sessionId);
    
    if (!connection || connection.status !== 'connected') {
      throw new Error(`Sesión ${sessionId} no está conectada`);
    }

    // Aplicar rate limiting
    await this.rateLimiter.checkLimit(sessionId);

    // Formatear número
    const formattedNumber = this.formatPhoneNumber(phoneNumber);

    try {
      // Enviar mensaje
      const result = await connection.client.sendText(
        formattedNumber, 
        message
      );

      // Registrar envío exitoso
      await this.logMessage(sessionId, phoneNumber, message, 'sent');

      return {
        success: true,
        messageId: result.id,
        timestamp: new Date()
      };
    } catch (error) {
      // Registrar error
      await this.logMessage(sessionId, phoneNumber, message, 'failed', error);
      throw error;
    }
  }

  /**
   * Enviar mensajes masivos
   * @param {string} sessionId
   * @param {Array} messages - [{phone, message, priority}]
   */
  async sendBulk(sessionId, messages) {
    const results = {
      total: messages.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const msg of messages) {
      try {
        await this.sendMessage(sessionId, msg.phone, msg.message);
        results.sent++;

        // Delay entre mensajes para evitar ban
        await this.delay(this.rateLimiter.delayBetweenMessages);
      } catch (error) {
        results.failed++;
        results.errors.push({
          phone: msg.phone,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Formatear número de teléfono
   */
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    
    // Agregar código de país si no existe
    if (!cleaned.startsWith('54')) {
      cleaned = '54' + cleaned;
    }

    return cleaned + '@c.us';
  }

  /**
   * Registrar mensaje en base de datos
   */
  async logMessage(sessionId, phone, message, status, error = null) {
    // Implementar logging en BD
    // Útil para auditoría y estadísticas
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MessageSender;
```

### Características Avanzadas

```javascript
// modules/whatsapp/sender/MessageQueue.js

class MessageQueue {
  constructor(sender) {
    this.sender = sender;
    this.queue = [];
    this.processing = false;
    this.priorities = {
      HIGH: 1,
      NORMAL: 2,
      LOW: 3
    };
  }

  /**
   * Agregar mensaje a la cola
   */
  enqueue(sessionId, phone, message, priority = 'NORMAL') {
    this.queue.push({
      sessionId,
      phone,
      message,
      priority: this.priorities[priority],
      timestamp: new Date(),
      retries: 0,
      maxRetries: 3
    });

    // Ordenar por prioridad
    this.queue.sort((a, b) => a.priority - b.priority);

    // Iniciar procesamiento si no está activo
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Procesar cola de mensajes
   */
  async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const item = this.queue.shift();

    try {
      await this.sender.sendMessage(
        item.sessionId, 
        item.phone, 
        item.message
      );
    } catch (error) {
      // Reintentar si es posible
      if (item.retries < item.maxRetries) {
        item.retries++;
        this.queue.push(item);
      } else {
        console.error(`Failed to send message after ${item.maxRetries} retries:`, error);
      }
    }

    // Procesar siguiente mensaje
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Obtener estado de la cola
   */
  getStatus() {
    return {
      pending: this.queue.length,
      processing: this.processing,
      byPriority: {
        high: this.queue.filter(m => m.priority === 1).length,
        normal: this.queue.filter(m => m.priority === 2).length,
        low: this.queue.filter(m => m.priority === 3).length
      }
    };
  }
}

module.exports = MessageQueue;
```

---

## 👂 Módulo 3: Message Listener

### Responsabilidades

- ✅ Escuchar mensajes entrantes
- ✅ Filtrar mensajes relevantes
- ✅ Parsear comandos
- ✅ Ejecutar respuestas automáticas
- ✅ Integrar con bot responder

### Ejemplo de Implementación

```javascript
// modules/whatsapp/listener/MessageListener.js

class MessageListener {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
    this.handlers = new Map(); // messageType -> handler function
    this.filters = [];
  }

  /**
   * Iniciar escucha de mensajes para una sesión
   */
  startListening(sessionId) {
    const connection = this.connectionManager.getConnection(sessionId);
    
    if (!connection) {
      throw new Error(`Sesión ${sessionId} no encontrada`);
    }

    // Escuchar mensajes
    connection.client.on('message', async (message) => {
      await this.handleMessage(sessionId, message);
    });

    // Escuchar cambios de estado
    connection.client.on('message_ack', (message, ack) => {
      this.handleMessageAck(sessionId, message, ack);
    });

    console.log(`👂 Listener activo para sesión: ${sessionId}`);
  }

  /**
   * Manejar mensaje entrante
   */
  async handleMessage(sessionId, message) {
    try {
      // Aplicar filtros
      if (!this.shouldProcessMessage(message)) {
        return;
      }

      // Extraer información
      const messageData = {
        sessionId,
        from: message.from,
        body: message.body,
        timestamp: message.timestamp,
        isGroup: message.isGroup,
        type: message.type,
        hasMedia: message.hasMedia
      };

      // Ejecutar handlers según tipo
      const handler = this.handlers.get(message.type) || this.handlers.get('default');
      
      if (handler) {
        await handler(messageData, message);
      }

      // Guardar mensaje en BD
      await this.saveMessage(messageData);

    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Registrar handler para tipo de mensaje
   */
  onMessage(type, handler) {
    this.handlers.set(type, handler);
  }

  /**
   * Agregar filtro de mensajes
   */
  addFilter(filterFn) {
    this.filters.push(filterFn);
  }

  /**
   * Verificar si mensaje debe procesarse
   */
  shouldProcessMessage(message) {
    // No procesar mensajes propios
    if (message.fromMe) return false;

    // Aplicar filtros personalizados
    for (const filter of this.filters) {
      if (!filter(message)) return false;
    }

    return true;
  }

  /**
   * Manejar confirmaciones de lectura
   */
  handleMessageAck(sessionId, message, ack) {
    const ackStatus = {
      0: 'error',
      1: 'pending',
      2: 'server',
      3: 'device',
      4: 'read',
      5: 'played'
    };

    console.log(`📧 Mensaje ${message.id} -> ${ackStatus[ack]}`);
    
    // Actualizar estado en BD
    this.updateMessageStatus(message.id, ackStatus[ack]);
  }

  /**
   * Guardar mensaje en base de datos
   */
  async saveMessage(messageData) {
    // Implementar guardado en BD
    // Útil para historial de conversaciones
  }

  /**
   * Actualizar estado de mensaje
   */
  async updateMessageStatus(messageId, status) {
    // Implementar actualización en BD
  }
}

module.exports = MessageListener;
```

### Integración con Bot Responder

```javascript
// modules/whatsapp/listener/CommandParser.js

class CommandParser {
  constructor() {
    this.commands = new Map();
  }

  /**
   * Registrar comando
   */
  registerCommand(trigger, handler, description) {
    this.commands.set(trigger.toLowerCase(), {
      handler,
      description
    });
  }

  /**
   * Parsear y ejecutar comando
   */
  async parse(message) {
    const text = message.body.trim().toLowerCase();

    // Verificar si es un comando (empieza con /)
    if (!text.startsWith('/')) {
      return null;
    }

    const [command, ...args] = text.slice(1).split(' ');
    const cmd = this.commands.get(command);

    if (!cmd) {
      return { error: 'Comando no encontrado' };
    }

    try {
      const result = await cmd.handler(message, args);
      return result;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Listar comandos disponibles
   */
  getCommands() {
    return Array.from(this.commands.entries()).map(([trigger, cmd]) => ({
      trigger,
      description: cmd.description
    }));
  }
}

module.exports = CommandParser;
```

---

## 🎛️ Servicio Unificado

### WhatsAppService - Fachada Principal

```javascript
// modules/whatsapp/WhatsAppService.js

class WhatsAppService {
  constructor() {
    this.connectionManager = new ConnectionManager();
    this.messageSender = new MessageSender(this.connectionManager);
    this.messageListener = new MessageListener(this.connectionManager);
    this.messageQueue = new MessageQueue(this.messageSender);
    this.commandParser = new CommandParser();
  }

  // ======== CONEXIONES ========

  async createSession(sessionId, options = {}) {
    const connection = await this.connectionManager.createConnection(sessionId, options);
    
    // Iniciar listener automáticamente
    this.messageListener.startListening(sessionId);
    
    return connection;
  }

  async closeSession(sessionId) {
    await this.connectionManager.closeConnection(sessionId);
  }

  getSessionStatus(sessionId) {
    const connection = this.connectionManager.getConnection(sessionId);
    return connection ? connection.status : 'not_found';
  }

  getQRCode(sessionId) {
    const connection = this.connectionManager.getConnection(sessionId);
    return connection?.qrCode || null;
  }

  // ======== ENVÍO ========

  async sendMessage(sessionId, phone, message) {
    return this.messageSender.sendMessage(sessionId, phone, message);
  }

  async sendBulk(sessionId, messages) {
    return this.messageSender.sendBulk(sessionId, messages);
  }

  queueMessage(sessionId, phone, message, priority = 'NORMAL') {
    this.messageQueue.enqueue(sessionId, phone, message, priority);
  }

  getQueueStatus() {
    return this.messageQueue.getStatus();
  }

  // ======== ESCUCHA ========

  onMessage(type, handler) {
    this.messageListener.onMessage(type, handler);
  }

  registerCommand(trigger, handler, description) {
    this.commandParser.registerCommand(trigger, handler, description);
  }

  // ======== UTILIDADES ========

  getAllSessions() {
    return this.connectionManager.getActiveConnections();
  }

  isSessionReady(sessionId) {
    return this.connectionManager.isConnected(sessionId);
  }
}

// Singleton
const instance = new WhatsAppService();
module.exports = instance;
```

---

## 🔄 Ejemplo de Uso

### En Routes

```javascript
// routes/haby.js - DESPUÉS DE MODULARIZACIÓN

const express = require('express');
const router = express.Router();
const whatsappService = require('../modules/whatsapp/WhatsAppService');

// Iniciar sesión
router.post('/api/wapp-session/init', async (req, res) => {
  try {
    await whatsappService.createSession('haby', {
      headless: process.env.NODE_ENV === 'production'
    });

    res.json({ ok: true, message: 'Sesión iniciando' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estado de sesión
router.get('/api/wapp-session', (req, res) => {
  const status = whatsappService.getSessionStatus('haby');
  const qrCode = whatsappService.getQRCode('haby');

  res.json({
    status,
    hasQR: !!qrCode,
    qr: qrCode
  });
});

// Enviar mensaje
router.post('/api/send-message', async (req, res) => {
  const { phone, message } = req.body;

  try {
    const result = await whatsappService.sendMessage('haby', phone, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### En Controllers

```javascript
// controllers/enviar_masivo.js - DESPUÉS DE MODULARIZACIÓN

const whatsappService = require('../modules/whatsapp/WhatsAppService');

const enviarMasivoManual = async (req, res) => {
  const { ids, sessionId = 'haby' } = req.body;

  try {
    const conn = await pool.getConnection();
    const [registros] = await conn.query(
      'SELECT telefono_wapp, mensaje_final FROM ll_envios_whatsapp WHERE id IN (?)',
      [ids]
    );
    conn.release();

    // Preparar mensajes
    const messages = registros.map(r => ({
      phone: r.telefono_wapp,
      message: r.mensaje_final,
      priority: 'NORMAL'
    }));

    // Enviar usando el servicio
    const results = await whatsappService.sendBulk(sessionId, messages);

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Listener de Mensajes

```javascript
// index.js - Configurar listeners

const whatsappService = require('./modules/whatsapp/WhatsAppService');

// Handler para mensajes de texto
whatsappService.onMessage('chat', async (messageData, originalMessage) => {
  console.log(`📩 Mensaje de ${messageData.from}: ${messageData.body}`);
  
  // Integrar con bot responder
  if (messageData.body.startsWith('/')) {
    const response = await whatsappService.commandParser.parse(originalMessage);
    
    if (response) {
      await whatsappService.sendMessage(
        messageData.sessionId,
        messageData.from,
        response.message
      );
    }
  }
});

// Registrar comandos
whatsappService.registerCommand('ayuda', async (message, args) => {
  const commands = whatsappService.commandParser.getCommands();
  const helpText = commands.map(c => `/${c.trigger} - ${c.description}`).join('\n');
  
  return { message: `Comandos disponibles:\n${helpText}` };
}, 'Muestra esta ayuda');

whatsappService.registerCommand('estado', async (message, args) => {
  const sessions = whatsappService.getAllSessions();
  return { 
    message: `Sesiones activas: ${sessions.length}` 
  };
}, 'Muestra estado del sistema');
```

---

## 📊 Comparación: Antes vs Después

| Aspecto | ❌ Antes | ✅ Después |
|---------|----------|------------|
| **Conexiones** | Dispersas en routes/bot | ConnectionManager centralizado |
| **Envío** | Funciones sueltas | MessageSender + Queue |
| **Escucha** | No existe | MessageListener + CommandParser |
| **Testing** | Imposible | Módulos independientes |
| **Escalabilidad** | Manual | Automática |
| **Mantenimiento** | Difícil | Sencillo |
| **Código duplicado** | Mucho | Eliminado |
| **Documentación** | Dispersa | Centralizada |

---

## 🚀 Plan de Implementación

### Fase 1: Módulo de Conexión (Semana 1)
- ✅ Crear ConnectionManager
- ✅ Implementar WhatsAppWebAdapter
- ✅ Migrar `/routes/haby.js` al nuevo sistema
- ✅ Tests unitarios

### Fase 2: Módulo de Envío (Semana 2)
- ✅ Crear MessageSender
- ✅ Implementar MessageQueue
- ✅ Integrar RateLimiter
- ✅ Migrar controllers de envío
- ✅ Tests de integración

### Fase 3: Módulo de Escucha (Semana 3)
- ✅ Crear MessageListener
- ✅ Implementar CommandParser
- ✅ Integrar con whatsapp-bot-responder
- ✅ Tests de eventos

### Fase 4: Integración Final (Semana 4)
- ✅ WhatsAppService como fachada
- ✅ Migrar todos los endpoints
- ✅ Eliminar código legacy
- ✅ Documentación completa
- ✅ Deploy a producción

---

## 🎯 Beneficios Esperados

### Técnicos
✅ **Código más limpio**: 60% menos líneas de código duplicado  
✅ **Testing**: Cobertura de 80%+  
✅ **Performance**: Queue optimizada reduce carga  
✅ **Observabilidad**: Logs y métricas centralizadas  

### Negocio
✅ **Escalabilidad**: Agregar clientes en minutos  
✅ **Confiabilidad**: Reintentos automáticos  
✅ **Mantenibilidad**: Cambios más rápidos  
✅ **Costo**: Menos bugs = menos tiempo de desarrollo  

---

## 📝 Conclusión

La modularización propuesta transforma el sistema actual de **código espagueti** a una **arquitectura limpia y escalable**. 

**Recomendación:** Implementar de forma incremental, comenzando por el módulo de conexión que es el más crítico.

¿Procedemos con la implementación? 🚀

