# 🚀 Checklist para Producción

## ⚠️ TAREAS CRÍTICAS (OBLIGATORIAS)

### 1. 🔒 Seguridad de Credenciales
- [ ] **Crear .env.example** (sin datos reales)
- [ ] **Agregar .env al .gitignore**
- [ ] **Eliminar .env del historial de Git** (si está commiteado)
- [ ] **Generar SESSION_SECRET único**
- [ ] **Cambiar passwords de producción**

### 2. 📝 Limpieza de Logs
- [ ] Eliminar/comentar console.log innecesarios
- [ ] Implementar logger profesional (winston/morgan)
- [ ] Configurar niveles de log (debug, info, error)

### 3. 🛡️ Variables de Entorno
- [ ] Validar que todas las variables estén en producción
- [ ] Configurar DB_HOST de producción
- [ ] Configurar PORT de producción
- [ ] SESSION_SECRET seguro

### 4. 📊 Base de Datos
- [ ] Backup completo de BD
- [ ] Verificar tabla ll_usuarios existe
- [ ] Crear usuarios admin y clientes
- [ ] Probar conexión desde servidor de producción

### 5. 🔐 Seguridad Adicional
- [ ] Configurar HTTPS (certificado SSL)
- [ ] Helmet.js para headers seguros
- [ ] Rate limiting en login
- [ ] CORS configurado correctamente
- [ ] Cookie secure: true en producción

### 6. 📦 Dependencias
- [ ] npm audit fix
- [ ] Actualizar paquetes vulnerables
- [ ] package-lock.json actualizado

### 7. 🧪 Testing
- [ ] Probar login como admin
- [ ] Probar login como cliente
- [ ] Probar CRUD de usuarios
- [ ] Probar envío de campañas
- [ ] Probar sesiones WhatsApp
- [ ] Probar logout

### 8. 📖 Documentación
- [ ] README.md con instrucciones de instalación
- [ ] Guía de configuración
- [ ] Documentación de API
- [ ] Manual de usuario

### 9. 🚀 Deployment
- [ ] Configurar PM2 o similar
- [ ] Configurar auto-restart
- [ ] Configurar logs de PM2
- [ ] Nginx/Apache como reverse proxy
- [ ] Configurar dominio

### 10. 📈 Monitoreo
- [ ] Logs centralizados
- [ ] Alertas de errores
- [ ] Monitoreo de uptime
- [ ] Backup automático

---

## 🔴 ACCIONES INMEDIATAS (HOY):

1. **Proteger credenciales:**
   ```bash
   # Crear .env.example
   cp .env .env.example
   # Editar .env.example y quitar valores reales
   
   # Agregar .env a .gitignore
   echo ".env" >> .gitignore
   
   # Generar SESSION_SECRET seguro
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Limpiar .env del historial de Git:**
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch .env" \
   --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```

3. **Eliminar console.log de producción:**
   - Comentar o eliminar console.log innecesarios
   - Usar process.env.NODE_ENV para logs condicionales

4. **Actualizar package.json:**
   ```json
   {
     "scripts": {
       "start": "NODE_ENV=production node index.js",
       "dev": "NODE_ENV=development nodemon index.js"
     }
   }
   ```

---

## ⚡ OPCIONALES (Mejoran calidad):

- [ ] Implementar 2FA
- [ ] Rate limiting global
- [ ] Compression middleware
- [ ] Static file caching
- [ ] CDN para assets
- [ ] Load balancer
- [ ] Redis para sesiones
- [ ] Logs a archivo
- [ ] Sentry para error tracking

---

## 📝 ESTIMACIÓN:

- **Críticas (obligatorias):** 4-6 horas
- **Opcionales:** 8-12 horas adicionales

---

## ⚠️ RIESGOS SI DESPLIEGAS AHORA:

1. 🚨 **Credenciales expuestas en GitHub** → Compromiso de seguridad
2. 🚨 **SESSION_SECRET débil** → Sesiones fáciles de hackear
3. ⚠️ **Sin HTTPS** → Passwords interceptables
4. ⚠️ **Console.logs excesivos** → Información sensible en logs
5. ⚠️ **Sin rate limiting** → Vulnerable a brute force
6. ⚠️ **Sin monitoreo** → No sabrás si algo falla

---

## ✅ RECOMENDACIÓN:

**NO DESPLEGAR TODAVÍA** hasta completar al menos las tareas críticas (1-5).

Tiempo estimado para estar listo: **1-2 días de trabajo**.

---

Última actualización: 3 de diciembre de 2025
