# Portal de Acceso Unificado DDW

## 🌐 Acceso al Sistema

El ecosistema DDW (Desarrollo y Diseño Web) está disponible en:

**URL Principal:** https://desarrolloydisenioweb.com.ar/

## 👥 Usuarios del Sistema

### 1️⃣ Cliente Haby
- **Usuario:** `haby`
- **Acceso:** `/haby/dashboard.html`
- **Funcionalidades:**
  - Gestión de sesión WhatsApp
  - Creación y gestión de campañas
  - Envío masivo de mensajes
  - Visualización de estadísticas

### 2️⃣ Cliente Marketing
- **Usuario:** `marketing`
- **Acceso:** `/marketing/dashboard.html`
- **Funcionalidades:**
  - Gestión de campañas de marketing
  - Análisis de campañas
  - Reportes y estadísticas

### 3️⃣ Administrador b3toh
- **Usuario:** `b3toh`
- **Acceso:** `/admin/dashboard.html`
- **Funcionalidades:**
  - Gestión completa del sistema
  - Administración de usuarios
  - Acceso a todos los módulos
  - Configuración del servidor

## 🔒 Sistema de Autenticación

### Flujo de Acceso

1. **Portal Principal** (/)
   - Página de bienvenida con información del ecosistema
   - Botón "Acceder al Dashboard"

2. **Login** (/login.html)
   - Formulario de autenticación
   - Validación de credenciales

3. **Redirección Automática**
   - Cada usuario es redirigido automáticamente a su dashboard
   - La sesión se mantiene activa con Redis

### Protección de Rutas

- **API Routes:** Protegidas con `requireAuth` middleware
- **Archivos Estáticos:** Validación de sesión y permisos
- **Carpetas de Clientes:** Acceso restringido por usuario

## 🛠️ Configuración Inicial

### Agregar Usuario Marketing

Si el usuario "marketing" no existe en la base de datos:

```bash
cd /home/beto/Documentos/Github/whatsapp-massive-sender
node scripts/agregar_usuario_marketing.js
```

**Credenciales por defecto:**
- Usuario: `marketing`
- Contraseña: `marketing123`

⚠️ **IMPORTANTE:** Cambiar la contraseña inmediatamente en producción.

## 🔄 Sincronización con Servidor

Para sincronizar cambios con el servidor Contabo:

```bash
# Desde el directorio del proyecto
rsync -avz --exclude 'node_modules' --exclude 'tokens' --exclude '.git' \
  /home/beto/Documentos/Github/whatsapp-massive-sender/ \
  root@vmi2656219.contaboserver.net:/root/whatsapp-massive-sender/
```

### Reiniciar el Servidor

```bash
ssh root@vmi2656219.contaboserver.net
cd /root/whatsapp-massive-sender
pm2 restart whatsapp-massive-sender
```

## 📊 Arquitectura del Portal

```
https://desarrolloydisenioweb.com.ar/
│
├── /                         → Portal DDW (index.html)
│   └── Botón: "Acceder"
│
├── /login.html               → Autenticación
│   └── Redirige según usuario:
│       ├── haby → /haby/dashboard.html
│       ├── marketing → /marketing/dashboard.html
│       └── b3toh → /admin/dashboard.html
│
├── /haby/*                   → Área Haby (protegida)
│   ├── dashboard.html
│   ├── campanias.html
│   └── api/wapp-session/*
│
├── /marketing/*              → Área Marketing (protegida)
│   ├── dashboard.html
│   └── campanias.html
│
└── /admin/*                  → Área Admin (protegida)
    └── dashboard.html
```

## 🎨 Diseño del Portal

El nuevo portal incluye:
- **Diseño moderno** con gradientes púrpura/azul
- **Cards animadas** para cada servicio:
  - 📱 WhatsApp Marketing
  - 🤖 Bot Responder
  - 🌐 API Lugares
- **Responsive** para todos los dispositivos
- **Branding DDW** consistente

## 📝 Notas de Seguridad

1. **Sesiones:** Almacenadas en Redis con TTL de 24 horas
2. **Passwords:** Hasheados con bcrypt (10 rounds)
3. **CSRF Protection:** Implementado con csurf
4. **Helmet:** Headers de seguridad HTTP
5. **Rate Limiting:** Express-rate-limit en endpoints sensibles

## 🚀 Despliegue en Producción

### Verificar Estado del Servidor

```bash
ssh root@vmi2656219.contaboserver.net
pm2 status
pm2 logs whatsapp-massive-sender
```

### Variables de Entorno

Asegúrate de que el archivo `.env` contenga:

```env
PORT=3010
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=ll
REDIS_HOST=localhost
REDIS_PORT=6379
SESSION_SECRET=tu_secret_aleatorio
```

## 📞 Soporte

Para cualquier problema de acceso:
1. Verificar que el servidor esté corriendo
2. Revisar logs: `pm2 logs whatsapp-massive-sender`
3. Verificar credenciales en la base de datos
4. Contactar al administrador (b3toh)

---

**DDW Ecosystem © 2025** - Micro SaaS Platform
