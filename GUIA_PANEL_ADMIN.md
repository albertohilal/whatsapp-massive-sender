# 📊 Guía del Panel de Administrador - Sistema WhatsApp

## 🎯 Vista General del Sistema

Tu panel administra **4 servicios principales**:

### 1. **whatsapp-massive-sender** (Envíos Masivos)
- **Puerto**: 3010
- **Función**: Enviar campañas de WhatsApp a múltiples contactos
- **Clientes**: Haby, Marketing
- **Estado actual**: ⚠️ Necesita reconectar sesión "haby"

### 2. **whatsapp-bot-responder** (Bot Respuestas Automáticas)
- **Función**: Escucha mensajes entrantes y puede responder automáticamente
- **Estado actual**: ✅ Funcionando correctamente
- **Modo**: Solo escucha (RESPONDER_ACTIVO=false)

### 3. **desarrolloydisenio-api** (API Backend)
- **Función**: API principal para el sitio desarrolloydisenio
- **Estado actual**: 🔴 Detenido

### 4. **crud-bares** (Sistema de Bares)
- **Función**: Sistema CRUD para gestión de bares
- **Estado actual**: 🔴 Detenido

---

## 🔧 Problemas Actuales y Soluciones

### ⚠️ Problema #1: Alta cantidad de reinicios

#### whatsapp-bot-responder: 1134 reinicios
**Causa**: El bot se reinicia cada vez que se actualiza código o hay cambios
**Solución**: ✅ Es normal si actualizas frecuentemente. Si quieres resetear el contador:
```bash
pm2 reset whatsapp-bot-responder
```

#### whatsapp-massive-sender: 99 reinicios
**Causa**: ⚠️ Sesión WhatsApp del cliente "haby" no está conectada
**Error repetido**: `⚠️ Programación 1: sesión WhatsApp haby no disponible`
**Solución**: Reconectar la sesión (ver más abajo)

---

## 🚀 Cómo Reconectar Sesión de WhatsApp para Cliente

### Opción 1: Desde tu máquina local (RECOMENDADO)
```bash
bash /tmp/reconectar-haby.sh
```

### Opción 2: Manualmente desde SSH
```bash
ssh root@209.126.4.25
cd ~/whatsapp-massive-sender
pm2 stop whatsapp-massive-sender
rm -rf clients/habysupply/tokens/*
pm2 restart whatsapp-massive-sender
pm2 logs whatsapp-massive-sender
# Busca el QR y escanéalo con WhatsApp
```

---

## 📱 Gestión de Respuestas Automáticas

### Estado Actual de Clientes:

| Cliente    | Estado  | Acción Disponible |
|------------|---------|-------------------|
| Haby       | Activo  | Desactivar        |
| Marketing  | Activo  | Desactivar        |

**¿Qué significa "Activo"?**
- El bot puede responder automáticamente a mensajes de este cliente
- **IMPORTANTE**: Actualmente `RESPONDER_ACTIVO=false` globalmente, así que aunque esté "Activo" en el panel, NO responde

**Para activar respuestas automáticas globalmente:**
1. SSH a Contabo: `ssh root@209.126.4.25`
2. Editar .env: `nano ~/whatsapp-bot-responder/.env`
3. Cambiar: `RESPONDER_ACTIVO=true`
4. Reiniciar: `pm2 restart whatsapp-bot-responder`

---

## 🎛️ Acciones del Panel

### Botones "Iniciar servidor"
- **Función**: Inicia servicios detenidos
- **Equivalente SSH**: `pm2 start <nombre-servicio>`

### Botones "Detener"
- **Función**: Detiene servicios en ejecución
- **Equivalente SSH**: `pm2 stop <nombre-servicio>`

### Botones "Reiniciar"
- **Función**: Reinicia servicios (útil después de cambios)
- **Equivalente SSH**: `pm2 restart <nombre-servicio>`

### Botón "Revisar campañas pendientes"
- **Función**: Muestra campañas programadas para envío masivo
- **Ubicación**: En la sección "Campañas"

---

## 🔍 Monitoreo del Sistema

### Desde el Panel:
- **Uptime**: Tiempo que lleva corriendo cada servicio
- **Reinicios**: Número de veces que se ha reiniciado
- **Estado**: online (🟢) o stopped (🔴)

### Desde SSH (más detallado):
```bash
# Ver estado de todos los servicios
ssh root@209.126.4.25 "pm2 status"

# Ver logs en tiempo real
ssh root@209.126.4.25 "pm2 logs whatsapp-massive-sender"
ssh root@209.126.4.25 "pm2 logs whatsapp-bot-responder"

# Ver uso de memoria
ssh root@209.126.4.25 "pm2 monit"

# Ver información detallada
ssh root@209.126.4.25 "pm2 show whatsapp-massive-sender"
```

---

## 🐛 Solución de Problemas Comunes

### Problema: "Sesión no disponible"
**Solución**: Reconectar sesión WhatsApp (ver sección anterior)

### Problema: Servicio no inicia
1. Verificar logs: `pm2 logs <nombre-servicio> --err --lines 50`
2. Verificar .env existe y está configurado
3. Verificar dependencias: `cd ~/<proyecto> && npm install`

### Problema: Alto uso de memoria
1. Reiniciar servicio: `pm2 restart <nombre-servicio>`
2. Si persiste, verificar logs para memory leaks

### Problema: No aparece QR
1. Verificar que el servicio esté corriendo: `pm2 status`
2. Ver logs completos: `pm2 logs <nombre-servicio> --lines 200`
3. Borrar tokens y reiniciar

---

## 📝 Comandos Útiles Rápidos

```bash
# Conectar a Contabo
ssh root@209.126.4.25

# Ver estado general
pm2 status

# Reiniciar todos los servicios
pm2 restart all

# Ver logs de todos
pm2 logs

# Guardar configuración actual
pm2 save

# Resetear contadores de reinicio
pm2 reset all
```

---

## 🔐 Credenciales y Accesos

- **Servidor**: 209.126.4.25
- **Usuario**: root
- **Panel Admin**: https://desarrolloydisenioloweb.com.ar/admin/dashboard.html
- **Base de Datos**: sv46.byethost46.org
- **Puerto API**: 3010

---

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────┐
│         SERVIDOR CONTABO (209.126.4.25)     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ whatsapp-massive-sender (Port 3010)   │ │
│  │ - Cliente: Haby                        │ │
│  │ - Cliente: Marketing                   │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ whatsapp-bot-responder                │ │
│  │ - Escucha mensajes                     │ │
│  │ - Respuestas automáticas (opcional)    │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ desarrolloydisenio-api                │ │
│  │ - API Backend principal                │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ crud-bares                            │ │
│  │ - Gestión de bares                     │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ MySQL Database      │
         │ sv46.byethost46.org │
         └─────────────────────┘
```

---

## 🎯 Próximos Pasos Recomendados

1. ✅ **Reconectar sesión "haby"** para detener los reinicios
2. 🔄 **Resetear contadores** de reinicio para limpiar el panel
3. 📊 **Iniciar servicios detenidos** si los necesitas (crud-bares, desarrolloydisenio-api)
4. 📱 **Decidir sobre respuestas automáticas**: ¿activar o mantener en modo escucha?
5. 📝 **Documentar campañas**: Revisar campañas pendientes y su configuración

---

## 💡 Mejoras Sugeridas para el Panel

1. **Agregar indicador de salud** (health check) para cada servicio
2. **Mostrar últimos logs** directamente en el panel
3. **Alertas automáticas** cuando un servicio tiene muchos reinicios
4. **Botón de "Ver QR"** para reconectar sesiones fácilmente
5. **Gráficas de uso** de memoria y CPU en tiempo real
6. **Logs en tiempo real** integrados en el panel
7. **Backup automático** de configuraciones y tokens
