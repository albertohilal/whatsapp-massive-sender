# 🏗️ Arquitectura Modular WhatsApp - Diagramas

## 📐 Diagrama de Arquitectura Completa

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CAPA DE PRESENTACIÓN                            │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │  routes/     │  │  routes/     │  │  routes/     │                 │
│  │  haby.js     │  │  marketing.js│  │  admin.js    │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                 │                  │                          │
└─────────┼─────────────────┼──────────────────┼──────────────────────────┘
          │                 │                  │
          └─────────────────┼──────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────────────┐
│                    CAPA DE SERVICIO (Fachada)                          │
│                                                                         │
│              ┌──────────────────────────────────────┐                  │
│              │   WhatsAppService (Singleton)        │                  │
│              │                                      │                  │
│              │  • createSession()                   │                  │
│              │  • sendMessage()                     │                  │
│              │  • onMessage()                       │                  │
│              │  • queueMessage()                    │                  │
│              └──────────────┬───────────────────────┘                  │
│                             │                                          │
└─────────────────────────────┼──────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│   CONNECTION   │   │    SENDER      │   │   LISTENER     │
│    MANAGER     │   │                │   │                │
│                │   │                │   │                │
│ ┌────────────┐ │   │ ┌────────────┐ │   │ ┌────────────┐ │
│ │ Session    │ │   │ │  Message   │ │   │ │  Message   │ │
│ │ Store      │ │   │ │  Sender    │ │   │ │  Listener  │ │
│ └────────────┘ │   │ └────────────┘ │   │ └────────────┘ │
│                │   │                │   │                │
│ ┌────────────┐ │   │ ┌────────────┐ │   │ ┌────────────┐ │
│ │ QR Code    │ │   │ │  Message   │ │   │ │  Command   │ │
│ │ Handler    │ │   │ │  Queue     │ │   │ │  Parser    │ │
│ └────────────┘ │   │ └────────────┘ │   │ └────────────┘ │
│                │   │                │   │                │
│ ┌────────────┐ │   │ ┌────────────┐ │   │ ┌────────────┐ │
│ │ Auth       │ │   │ │ Rate       │ │   │ │  Event     │ │
│ │ Handler    │ │   │ │ Limiter    │ │   │ │  Handler   │ │
│ └────────────┘ │   │ └────────────┘ │   │ └────────────┘ │
└────────┬───────┘   └────────┬───────┘   └────────┬───────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────────┐
│                       CAPA DE ADAPTADORES                              │
│                                                                         │
│  ┌──────────────────────┐          ┌──────────────────────┐           │
│  │ WhatsAppWebAdapter   │          │  VenomBotAdapter     │           │
│  │                      │          │                      │           │
│  │ • createClient()     │          │ • createClient()     │           │
│  │ • sendText()         │          │ • sendText()         │           │
│  │ • on(events)         │          │ • on(events)         │           │
│  └──────────┬───────────┘          └──────────┬───────────┘           │
│             │                                 │                        │
└─────────────┼─────────────────────────────────┼────────────────────────┘
              │                                 │
              ▼                                 ▼
    ┌──────────────────┐           ┌──────────────────┐
    │ whatsapp-web.js  │           │   venom-bot      │
    │   (librería)     │           │   (librería)     │
    └──────────────────┘           └──────────────────┘
```

---

## 🔄 Flujo de Conexión

```
Usuario
  │
  │ 1. POST /haby/api/wapp-session/init
  ▼
routes/haby.js
  │
  │ 2. whatsappService.createSession('haby')
  ▼
WhatsAppService
  │
  │ 3. connectionManager.createConnection()
  ▼
ConnectionManager
  │
  │ 4. adapter.createClient('haby')
  ▼
WhatsAppWebAdapter
  │
  │ 5. new Client({...})
  ▼
whatsapp-web.js
  │
  │ 6. Genera QR
  ▼
ConnectionManager
  │
  │ 7. Emite evento 'qr'
  ▼
routes/haby.js
  │
  │ 8. GET /haby/api/wapp-session/qr-image
  │    → Devuelve QR al cliente
  ▼
Usuario escanea QR
  │
  │ 9. WhatsApp autentica
  ▼
whatsapp-web.js
  │
  │ 10. Emite evento 'ready'
  ▼
ConnectionManager
  │
  │ 11. Actualiza status = 'connected'
  ▼
MessageListener
  │
  │ 12. startListening('haby')
  │     → Comienza a escuchar mensajes
  ▼
Sistema listo ✅
```

---

## 📤 Flujo de Envío de Mensaje

```
Cliente Frontend
  │
  │ 1. POST /api/send-message
  │    { phone: "1234567890", message: "Hola" }
  ▼
routes/haby.js
  │
  │ 2. whatsappService.sendMessage('haby', phone, message)
  ▼
WhatsAppService
  │
  │ 3. messageSender.sendMessage()
  ▼
MessageSender
  │
  │ 4. rateLimiter.checkLimit('haby')
  │    → Espera si supera límite
  ▼
MessageSender
  │
  │ 5. connectionManager.getConnection('haby')
  │    → Verifica que esté conectado
  ▼
MessageSender
  │
  │ 6. client.sendText(formattedNumber, message)
  ▼
whatsapp-web.js
  │
  │ 7. Envía mensaje real por WhatsApp
  ▼
WhatsApp Servers
  │
  │ 8. Confirma envío
  ▼
MessageSender
  │
  │ 9. logMessage() → Guarda en BD
  ▼
Cliente Frontend
  │
  │ 10. Recibe { success: true, messageId: "..." }
  ▼
✅ Mensaje enviado
```

---

## 📥 Flujo de Recepción de Mensaje

```
Usuario de WhatsApp
  │
  │ 1. Envía mensaje "Hola"
  ▼
WhatsApp Servers
  │
  │ 2. Entregan mensaje a cliente conectado
  ▼
whatsapp-web.js
  │
  │ 3. Emite evento 'message'
  ▼
MessageListener
  │
  │ 4. handleMessage(message)
  ▼
MessageListener
  │
  │ 5. shouldProcessMessage()?
  │    → Filtra mensajes propios
  │    → Aplica filtros personalizados
  ▼
MessageListener
  │
  │ 6. Extrae messageData
  │    { from, body, timestamp, type }
  ▼
MessageListener
  │
  │ 7. Ejecuta handler según tipo
  │    → handlers.get('chat')
  ▼
Handler Personalizado
  │
  │ 8. ¿Es comando? (empieza con /)
  ▼
CommandParser
  │
  │ 9. parse(message)
  │    → /ayuda → Devuelve lista comandos
  │    → /estado → Devuelve estado sistema
  ▼
MessageSender
  │
  │ 10. sendMessage(from, response)
  │     → Envía respuesta automática
  ▼
Usuario de WhatsApp
  │
  │ 11. Recibe respuesta
  ▼
✅ Conversación automática
```

---

## 📊 Flujo de Envío Masivo con Cola

```
Admin Dashboard
  │
  │ 1. POST /api/enviar-masivo
  │    { ids: [1, 2, 3, ...1000] }
  ▼
controllers/enviar_masivo.js
  │
  │ 2. Consulta BD → Obtiene 1000 registros
  ▼
controllers/enviar_masivo.js
  │
  │ 3. for cada registro:
  │     whatsappService.queueMessage(...)
  ▼
MessageQueue
  │
  │ 4. enqueue() → Agrega a cola
  │    → Ordena por prioridad
  ├──► [HIGH: 10 msgs]
  ├──► [NORMAL: 980 msgs]
  └──► [LOW: 10 msgs]
  │
  │ 5. processQueue() → Inicia procesamiento
  ▼
MessageQueue
  │
  │ 6. Toma siguiente mensaje de cola
  │    → Respeta prioridad
  ▼
MessageSender
  │
  │ 7. sendMessage()
  │    → Aplica rate limiter
  │    → Espera 3 segundos entre mensajes
  ▼
whatsapp-web.js
  │
  │ 8. Envía mensaje
  ▼
  │ ✅ Éxito
  │    → Marca como enviado
  │    → Siguiente mensaje
  │
  │ ❌ Error
  │    → Reintenta (máx 3 veces)
  │    → Si falla todo → Marca como error
  ▼
MessageQueue
  │
  │ 9. Continúa hasta vaciar cola
  │    Velocidad: ~20 msgs/min (anti-ban)
  ▼
Admin Dashboard
  │
  │ 10. Polling: GET /api/queue-status
  │     { pending: 950, sent: 50, failed: 0 }
  ▼
✅ Envío masivo completado
```

---

## 🔀 Diagrama de Estados de Sesión

```
┌──────────────┐
│ NOT_CREATED  │
└──────┬───────┘
       │ createSession()
       ▼
┌──────────────┐
│ INITIALIZING │◄────┐
└──────┬───────┘     │
       │             │ reconectar()
       │             │
       ▼             │
┌──────────────┐     │
│ QR_GENERATED │     │
└──────┬───────┘     │
       │             │
       │ escanear QR │
       ▼             │
┌──────────────┐     │
│ AUTHENTICATED│     │
└──────┬───────┘     │
       │             │
       ▼             │
┌──────────────┐     │
│  CONNECTED   │─────┘
└──────┬───────┘
       │
       │ desconexión
       ▼
┌──────────────┐
│ DISCONNECTED │
└──────┬───────┘
       │ cerrar sesión
       ▼
┌──────────────┐
│   CLOSED     │
└──────────────┘
```

---

## 🧩 Diagrama de Dependencias

```
┌─────────────────────────────────────────────────┐
│             WhatsAppService                     │
│  (Fachada - No tiene lógica, solo coordina)    │
└────────┬──────────────────────────┬─────────────┘
         │                          │
    ┌────▼────┐              ┌──────▼──────┐
    │Connection│◄────────────│MessageSender│
    │ Manager  │              │             │
    └────┬────┘              └──────┬──────┘
         │                          │
         │                    ┌─────▼──────┐
         │                    │ Message    │
         │                    │ Queue      │
         │                    └─────┬──────┘
         │                          │
         │                    ┌─────▼──────┐
         │                    │ Rate       │
         │                    │ Limiter    │
         │                    └────────────┘
         │
    ┌────▼────────┐
    │  Message    │
    │  Listener   │
    └────┬────────┘
         │
    ┌────▼────────┐
    │  Command    │
    │  Parser     │
    └─────────────┘

Leyenda:
→  Dependencia directa
◄  Recibe instancia de
```

---

## 📦 Estructura de Archivos Propuesta

```
modules/
└── whatsapp/
    ├── WhatsAppService.js           # Servicio principal (fachada)
    │
    ├── connection/
    │   ├── index.js                 # Exporta todos los módulos
    │   ├── ConnectionManager.js     # Gestión de conexiones
    │   ├── SessionStore.js          # Almacenamiento de sesiones
    │   ├── QRCodeHandler.js         # Manejo de QR codes
    │   └── AuthHandler.js           # Autenticación
    │
    ├── sender/
    │   ├── index.js
    │   ├── MessageSender.js         # Envío individual
    │   ├── BulkSender.js            # Envío masivo
    │   ├── MessageQueue.js          # Cola de mensajes
    │   └── RateLimiter.js           # Control de velocidad
    │
    ├── listener/
    │   ├── index.js
    │   ├── MessageListener.js       # Escucha de mensajes
    │   ├── EventHandler.js          # Manejo de eventos
    │   ├── CommandParser.js         # Parser de comandos
    │   └── ResponseHandler.js       # Respuestas automáticas
    │
    ├── adapters/
    │   ├── BaseAdapter.js           # Interfaz base
    │   ├── WhatsAppWebAdapter.js    # Adaptador whatsapp-web.js
    │   └── VenomBotAdapter.js       # Adaptador venom-bot
    │
    ├── utils/
    │   ├── phoneFormatter.js        # Formateo de números
    │   ├── logger.js                # Logging
    │   └── validators.js            # Validaciones
    │
    └── types/
        ├── Message.js               # Tipo Message
        ├── Session.js               # Tipo Session
        └── Connection.js            # Tipo Connection
```

---

## 🎯 Principios de Diseño Aplicados

### 1️⃣ Single Responsibility Principle (SRP)
```
❌ ANTES: routes/haby.js hacía TODO
   • Crear cliente
   • Manejar QR
   • Enviar mensajes
   • Gestionar sesión

✅ DESPUÉS: Cada módulo una responsabilidad
   • ConnectionManager → Solo conexiones
   • MessageSender → Solo envío
   • MessageListener → Solo escucha
```

### 2️⃣ Dependency Inversion Principle (DIP)
```
❌ ANTES: Routes dependen de whatsapp-web.js directamente

✅ DESPUÉS: Dependen de abstracción (WhatsAppService)
           Adaptadores encapsulan implementaciones
```

### 3️⃣ Open/Closed Principle (OCP)
```
❌ ANTES: Agregar cliente = modificar código existente

✅ DESPUÉS: Agregar cliente = crear nueva instancia
           Sin modificar código base
```

### 4️⃣ Interface Segregation Principle (ISP)
```
✅ Interfaces específicas:
   • IConnection → createConnection, closeConnection
   • ISender → sendMessage, sendBulk
   • IListener → onMessage, startListening
```

### 5️⃣ Liskov Substitution Principle (LSP)
```
✅ Adaptadores intercambiables:
   • WhatsAppWebAdapter puede reemplazar VenomBotAdapter
   • Sin cambiar código que los usa
```

---

## 📈 Métricas Esperadas

### Antes de Modularización
```
├── Líneas de código duplicado: ~500
├── Archivos modificados por nuevo cliente: 5-7
├── Tiempo agregar cliente: 2-3 horas
├── Cobertura de tests: 0%
├── Bugs por mes: 8-12
└── Deuda técnica: Alta
```

### Después de Modularización
```
├── Líneas de código duplicado: ~50
├── Archivos modificados por nuevo cliente: 1
├── Tiempo agregar cliente: 10 minutos
├── Cobertura de tests: 80%+
├── Bugs por mes: 1-3
└── Deuda técnica: Baja
```

---

**¿Listo para implementar? 🚀**
