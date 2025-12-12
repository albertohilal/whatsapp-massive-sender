# 🚀 PLAN: Nuevo Proyecto Unificado y Modular WhatsApp

**Fecha:** 5 de diciembre de 2025  
**Proyecto:** `whatsapp-unified-system` (nombre provisional)  
**Estrategia:** Mantener proyectos actuales en producción, crear uno nuevo desde cero

---

## 📌 DECISIÓN ESTRATÉGICA

### ✅ LO QUE HAREMOS:
1. **Mantener en producción sin tocar:**
   - `whatsapp-massive-sender` (funcionando)
   - `whatsapp-bot-responder` (funcionando)

2. **Crear proyecto nuevo:**
   - Nombre: `whatsapp-unified-system` o `whatsapp-platform`
   - Aplicar arquitectura modular desde cero
   - Incorporar mejores prácticas
   - Unificar funcionalidades (escucha + envío)

3. **Migración gradual:**
   - Desarrollo y testing en local
   - Testing en servidor de staging (si existe)
   - Deploy en producción solo cuando esté 100% probado
   - Migración por cliente (empezar con uno de prueba)

---

## 🏗️ ARQUITECTURA DEL NUEVO PROYECTO

### **Estructura de Carpetas**

```
whatsapp-unified-system/
├─ config/
│  ├─ database.js           # Configuración MySQL
│  ├─ whatsapp.js           # Configuración venom-bot
│  └─ openai.js             # Configuración OpenAI
│
├─ core/                    # ⭐ Núcleo modular
│  ├─ WhatsAppManager.js    # Gestor principal de sesiones
│  ├─ SessionHandler.js     # Manejo de sesión individual
│  ├─ MessageListener.js    # Escucha de mensajes entrantes
│  ├─ MessageSender.js      # Envío de mensajes
│  └─ QRManager.js          # Gestión de QR codes
│
├─ modules/                 # 📦 Módulos funcionales
│  ├─ campaigns/
│  │  ├─ CampaignService.js
│  │  ├─ CampaignScheduler.js
│  │  └─ CampaignController.js
│  │
│  ├─ conversations/
│  │  ├─ ConversationService.js
│  │  ├─ ConversationRepository.js
│  │  └─ ConversationController.js
│  │
│  ├─ ai/
│  │  ├─ AIService.js
│  │  ├─ OpenAIAdapter.js
│  │  └─ ResponseGenerator.js
│  │
│  └─ clients/
│     ├─ ClientService.js
│     ├─ ClientRepository.js
│     └─ ClientController.js
│
├─ adapters/                # 🔌 Adaptadores externos
│  ├─ VenomAdapter.js       # Abstracción de venom-bot
│  ├─ DatabaseAdapter.js    # Abstracción de MySQL
│  └─ CacheAdapter.js       # Abstracción de Redis
│
├─ routes/
│  ├─ api/
│  │  ├─ sessions.js
│  │  ├─ campaigns.js
│  │  ├─ conversations.js
│  │  └─ clients.js
│  └─ web/
│     ├─ dashboard.js
│     └─ auth.js
│
├─ middleware/
│  ├─ auth.js
│  ├─ validation.js
│  └─ errorHandler.js
│
├─ public/                  # Frontend
│  ├─ admin/
│  ├─ client/
│  └─ assets/
│
├─ tests/                   # ⭐ Testing desde el inicio
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
│
├─ scripts/
│  ├─ migrate-from-massive.js
│  ├─ migrate-from-bot.js
│  └─ setup-db.js
│
├─ .env.example
├─ .gitignore
├─ package.json
├─ README.md
└─ ARCHITECTURE.md
```

---

## 🎯 PRINCIPIOS DE DISEÑO

### 1. **Separación de Responsabilidades**
Cada módulo tiene una única responsabilidad clara:

```javascript
// ❌ ANTES (en massive-sender)
router.post('/haby/session/init', (req, res) => {
  const client = new Client({ /* config */ });
  client.on('qr', qr => { /* ... */ });
  client.on('ready', () => { /* ... */ });
  client.initialize();
});

// ✅ NUEVO (modular)
const whatsappManager = new WhatsAppManager();
const session = await whatsappManager.createSession('haby', {
  onQR: (qr) => io.emit('qr', qr),
  onReady: () => io.emit('ready'),
  onMessage: (msg) => messageListener.handle(msg)
});
```

### 2. **Inversión de Dependencias**
Los módulos de alto nivel no dependen de implementaciones específicas:

```javascript
// Core no conoce Venom directamente
class WhatsAppManager {
  constructor(whatsappAdapter) {  // Inyección de dependencia
    this.adapter = whatsappAdapter;
  }
  
  async createSession(name, callbacks) {
    return this.adapter.createClient(name, callbacks);
  }
}

// Se puede cambiar de Venom a otra librería fácilmente
const venomAdapter = new VenomAdapter();
const manager = new WhatsAppManager(venomAdapter);
```

### 3. **Eventos sobre Callbacks**
Sistema basado en eventos para desacoplar módulos:

```javascript
// Emisor de eventos
class SessionHandler extends EventEmitter {
  onMessage(message) {
    this.emit('message:received', message);
  }
}

// Cualquier módulo puede escuchar sin acoplamiento
sessionHandler.on('message:received', (msg) => {
  conversationService.save(msg);
  if (aiEnabled) aiService.generateResponse(msg);
});
```

### 4. **Configuración Centralizada**
Toda configuración en archivos específicos:

```javascript
// config/whatsapp.js
module.exports = {
  venom: {
    headless: process.env.NODE_ENV === 'production',
    useChrome: true,
    executablePath: '/usr/bin/google-chrome-stable',
    browserArgs: ['--no-sandbox']
  },
  sessions: {
    maxRetries: 3,
    retryDelay: 5000,
    qrTimeout: 60000
  }
};
```

### 5. **Testing desde el Inicio**
Cada módulo con sus tests:

```javascript
// tests/unit/core/WhatsAppManager.test.js
describe('WhatsAppManager', () => {
  it('should create session with mock adapter', async () => {
    const mockAdapter = new MockWhatsAppAdapter();
    const manager = new WhatsAppManager(mockAdapter);
    
    const session = await manager.createSession('test');
    expect(session).toBeDefined();
  });
});
```

---

## 📦 MÓDULOS PRINCIPALES

### **1. WhatsAppManager** (Gestor Central)
```
Responsabilidad: Gestionar todas las sesiones de WhatsApp
├─ Crear sesiones nuevas
├─ Obtener sesiones existentes
├─ Cerrar sesiones
├─ Listar sesiones activas
└─ Reconectar sesiones caídas
```

### **2. SessionHandler** (Manejo de Sesión)
```
Responsabilidad: Manejar el ciclo de vida de una sesión individual
├─ Inicializar conexión
├─ Manejar eventos (qr, ready, disconnected)
├─ Gestionar estado de conexión
└─ Emitir eventos para otros módulos
```

### **3. MessageListener** (Escucha de Mensajes)
```
Responsabilidad: Procesar mensajes entrantes
├─ Normalizar mensajes
├─ Detectar duplicados
├─ Guardar en BD
├─ Notificar a módulos interesados
└─ Trigger respuestas IA si está activado
```

### **4. MessageSender** (Envío de Mensajes)
```
Responsabilidad: Enviar mensajes salientes
├─ Envío simple (un mensaje)
├─ Envío masivo (campañas)
├─ Cola de envíos
├─ Reintentos automáticos
└─ Logging de envíos
```

### **5. CampaignService** (Gestión de Campañas)
```
Responsabilidad: Manejar campañas de envío
├─ Crear/editar campañas
├─ Seleccionar destinatarios
├─ Programar envíos
├─ Ejecutar campañas
└─ Reportes de campañas
```

### **6. AIService** (Inteligencia Artificial)
```
Responsabilidad: Generar respuestas con IA
├─ Analizar mensaje entrante
├─ Obtener contexto/historial
├─ Generar respuesta con OpenAI
├─ Aplicar reglas de negocio
└─ Formatear respuesta
```

---

## 🔄 FLUJOS PRINCIPALES

### **Flujo 1: Crear Sesión WhatsApp**
```
1. Cliente hace login → Dashboard
2. Cliente hace clic "Conectar WhatsApp"
3. Frontend → POST /api/sessions/create { clientId: 'haby' }
4. WhatsAppManager.createSession('haby')
5. SessionHandler inicializa cliente Venom
6. Venom emite QR → SessionHandler → Socket.io → Frontend
7. Cliente escanea QR
8. Venom emite 'ready' → SessionHandler guarda estado
9. MessageListener se registra en la sesión
10. Frontend muestra "Conectado ✓"
```

### **Flujo 2: Mensaje Entrante + Respuesta IA**
```
1. WhatsApp → Mensaje llega al número del cliente
2. Venom emite 'message' → SessionHandler
3. SessionHandler → MessageListener.handle(message)
4. MessageListener normaliza y guarda en ll_ia_conversaciones
5. MessageListener verifica si cliente tiene IA activada
6. SI activada → AIService.generateResponse(message)
7. AIService obtiene historial de ConversationRepository
8. AIService llama OpenAI con contexto
9. AIService recibe respuesta
10. MessageSender.send(clientId, number, response)
11. MessageListener guarda respuesta en BD
```

### **Flujo 3: Campaña Masiva**
```
1. Cliente crea campaña → POST /api/campaigns/create
2. Cliente selecciona prospectos → POST /api/campaigns/add-recipients
3. Admin o scheduler detecta campaña pendiente
4. CampaignService.execute(campaignId)
5. CampaignService obtiene destinatarios de BD
6. Por cada destinatario:
   a. Reemplaza placeholders {{nombre}}, {{rubro}}
   b. MessageSender.send(sessionName, number, message)
   c. Marca envío como 'enviado' o 'fallido'
   d. Delay entre envíos (evitar spam)
7. Campaña completada → notificar cliente
```

---

## 🛠️ TECNOLOGÍAS Y LIBRERÍAS

### **Core**
- Node.js 20.x LTS
- Express 4.x
- Socket.io (para QR en tiempo real)
- venom-bot (abstracción mediante adapter)

### **Base de Datos**
- MySQL 8.x (existente)
- mysql2 (driver)
- Redis (opcional, para cache y colas)

### **IA**
- OpenAI API 4.x
- LangChain (opcional, para cadenas más complejas)

### **Frontend**
- HTML/CSS/JS vanilla (mantener simple)
- Socket.io-client
- Chart.js (para métricas)

### **Testing**
- Jest (unit & integration)
- Supertest (API testing)
- Playwright (E2E testing)

### **Desarrollo**
- ESLint + Prettier
- Husky (pre-commit hooks)
- Nodemon (desarrollo)
- PM2 (producción)

---

## 📋 PLAN DE DESARROLLO (Fases)

### **FASE 0: Setup Inicial** (1-2 días)
- [ ] Crear repositorio nuevo
- [ ] Configurar estructura de carpetas
- [ ] Setup ESLint, Prettier, Git hooks
- [ ] Configurar Jest
- [ ] Crear README y ARCHITECTURE.md
- [ ] Setup básico de Express + Socket.io

### **FASE 1: Core WhatsApp** (3-5 días)
- [ ] Implementar VenomAdapter
- [ ] Crear WhatsAppManager
- [ ] Crear SessionHandler
- [ ] Crear QRManager
- [ ] Tests unitarios del core
- [ ] Documentar API del core

### **FASE 2: Mensajería Básica** (2-3 días)
- [ ] Implementar MessageListener
- [ ] Implementar MessageSender
- [ ] Sistema de eventos
- [ ] Cola de mensajes (simple)
- [ ] Tests de mensajería

### **FASE 3: Base de Datos** (2 días)
- [ ] DatabaseAdapter
- [ ] ConversationRepository
- [ ] CampaignRepository
- [ ] ClientRepository
- [ ] Scripts de migración de esquema
- [ ] Seeds para testing

### **FASE 4: Autenticación y Clientes** (2-3 días)
- [ ] Sistema de auth (JWT o sessions)
- [ ] Middleware de autorización
- [ ] ClientService
- [ ] ClientController
- [ ] CRUD de clientes
- [ ] Tests de autenticación

### **FASE 5: Campañas** (4-5 días)
- [ ] CampaignService
- [ ] CampaignScheduler
- [ ] CampaignController
- [ ] Sistema de placeholders
- [ ] Cola de envíos masivos
- [ ] Tests de campañas

### **FASE 6: IA y Conversaciones** (3-4 días)
- [ ] OpenAIAdapter
- [ ] AIService
- [ ] ConversationService
- [ ] ResponseGenerator
- [ ] Control de IA por cliente
- [ ] Tests de IA (con mocks)

### **FASE 7: Frontend Admin** (3-4 días)
- [ ] Dashboard administrativo
- [ ] Gestión de clientes
- [ ] Gestión de sesiones WhatsApp
- [ ] Monitoreo de servicios
- [ ] Métricas y reportes

### **FASE 8: Frontend Cliente** (3-4 días)
- [ ] Dashboard por cliente
- [ ] Gestión de sesión WhatsApp
- [ ] Crear/editar campañas
- [ ] Seleccionar prospectos
- [ ] Ver conversaciones IA
- [ ] Reportes de envíos

### **FASE 9: Testing Integral** (2-3 días)
- [ ] Tests E2E completos
- [ ] Tests de carga
- [ ] Tests de recuperación ante fallos
- [ ] Documentación de tests

### **FASE 10: Migración y Deploy** (3-5 días)
- [ ] Scripts de migración de datos
- [ ] Migrar prospectos (ll_lugares)
- [ ] Migrar campañas existentes
- [ ] Migrar conversaciones IA
- [ ] Setup en servidor staging
- [ ] Deploy en producción
- [ ] Monitoreo post-deploy

---

## 🔄 ESTRATEGIA DE MIGRACIÓN

### **Opción A: Migración por Cliente (RECOMENDADO)**
```
1. Nuevo sistema en staging con 1 cliente de prueba
2. Testing exhaustivo
3. Migrar cliente "haby" primero
4. Mantener ambos sistemas corriendo 1 semana
5. Si todo OK → migrar "marketing"
6. Repetir hasta migrar todos
7. Deprecar sistema antiguo
```

### **Opción B: Migración Big Bang**
```
1. Desarrollo completo en local/staging
2. Testing exhaustivo
3. Migrar todos los datos
4. Parada de mantenimiento programada
5. Deploy del nuevo sistema
6. Activar todos los clientes
```

**→ Recomiendo Opción A** (menos riesgoso)

---

## 📊 COMPARACIÓN: Sistema Actual vs Nuevo

| Aspecto | Sistema Actual | Nuevo Sistema |
|---------|----------------|---------------|
| **Proyectos** | 2 (massive + bot) | 1 unificado |
| **Arquitectura** | Monolítica | Modular |
| **Testing** | Manual, sin tests | Automatizado, TDD |
| **Código duplicado** | Alto (2 whatsapp libs) | Cero (1 adapter) |
| **Escalabilidad** | Difícil | Fácil (módulos) |
| **Mantenimiento** | Complejo | Simple |
| **Documentación** | Parcial | Completa |
| **Deploy** | 2 deploys | 1 deploy |
| **Cambio de librería** | Reescribir todo | Cambiar adapter |
| **Agregar cliente** | Múltiples archivos | ClientService.create() |
| **Testing unitario** | No existe | Cobertura >80% |
| **Logs** | Dispersos | Centralizados |
| **Monitoreo** | Manual | Dashboard integrado |

---

## 🎯 CRITERIOS DE ÉXITO

### **Funcionales:**
- ✅ Un cliente puede conectar su WhatsApp escaneando QR
- ✅ Puede crear y enviar campañas masivas
- ✅ Recibe mensajes y opcionalmente responde con IA
- ✅ Ve historial de conversaciones
- ✅ Ve estadísticas de campañas

### **Técnicos:**
- ✅ Cobertura de tests >80%
- ✅ Tiempo de respuesta API <200ms (p95)
- ✅ Zero downtime deployment
- ✅ Logs centralizados y estructurados
- ✅ Métricas de salud en tiempo real

### **Operacionales:**
- ✅ Deploy con un comando
- ✅ Rollback con un comando
- ✅ Backup automático diario
- ✅ Alertas configuradas (email/slack)
- ✅ Documentación actualizada

---

## 🚀 CÓMO EMPEZAR

### **Paso 1: Crear repositorio**
```bash
cd ~/Documentos/Github
mkdir whatsapp-unified-system
cd whatsapp-unified-system
git init
npm init -y
```

### **Paso 2: Estructura básica**
```bash
mkdir -p {config,core,modules,adapters,routes,middleware,public,tests,scripts}
touch README.md ARCHITECTURE.md .gitignore .env.example
```

### **Paso 3: Instalar dependencias base**
```bash
npm install express socket.io mysql2 redis dotenv
npm install -D jest eslint prettier husky nodemon
```

### **Paso 4: Configurar linting**
```bash
npx eslint --init
echo "module.exports = { semi: true, singleQuote: true };" > .prettierrc.js
```

### **Paso 5: Primer módulo (WhatsAppManager)**
```bash
touch core/WhatsAppManager.js
touch tests/unit/WhatsAppManager.test.js
# Escribir test primero (TDD)
# Implementar código hasta que pase
```

---

## 📚 RECURSOS Y REFERENCIAS

### **Documentación:**
- Venom-bot: https://github.com/orkestral/venom
- Express: https://expressjs.com/
- Socket.io: https://socket.io/
- OpenAI API: https://platform.openai.com/docs
- Jest: https://jestjs.io/

### **Patrones de Diseño:**
- Repository Pattern (para BD)
- Adapter Pattern (para librerías externas)
- Observer Pattern (para eventos)
- Dependency Injection (para testabilidad)

### **Arquitectura:**
- Clean Architecture
- Hexagonal Architecture
- SOLID Principles

---

## ✅ CHECKLIST DE INICIO

- [ ] Leer documento completo
- [ ] Decidir nombre final del proyecto
- [ ] Crear repositorio en GitHub
- [ ] Setup estructura inicial
- [ ] Configurar herramientas de desarrollo
- [ ] Escribir primer test
- [ ] Implementar primer módulo (WhatsAppManager)
- [ ] Configurar CI/CD básico
- [ ] Documentar decisiones arquitecturales
- [ ] Definir cronograma detallado

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Revisar este plan** y ajustar según necesidades
2. **Decidir nombre** del proyecto
3. **Crear repositorio** y estructura
4. **Empezar Fase 0** (Setup Inicial)
5. **Implementar primer módulo** con TDD

---

**Documento creado:** 5 de diciembre de 2025  
**Versión:** 1.0  
**Estado:** Plan inicial - Pendiente de aprobación  
**Próxima revisión:** Después de Fase 0
