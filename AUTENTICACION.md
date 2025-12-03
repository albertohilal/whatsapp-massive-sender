# 🔐 Sistema de Autenticación Seguro

## Implementación completada

### ✅ Componentes instalados:

1. **Middleware de autenticación** (`/middleware/requireAuth.js`)
   - `requireAuth`: Verifica que haya sesión activa
   - `requireAdmin`: Solo permite acceso a administradores
   - `requireCliente`: Solo permite acceso a clientes

2. **Rutas protegidas** (actualizadas en `index.js`)
   - Todas las rutas `/api/*` requieren autenticación
   - `/api/generar-envios` requiere permisos de admin
   - `/habysupply/api/*` requiere autenticación
   - `/admin/*` requiere autenticación

3. **Sistema de logout** (`/routes/auth.js`)
   - `POST /api/logout` - Cierra sesión y limpia cookies

4. **Script para crear usuarios** (`/scripts/crear_usuario.js`)
   - Crea usuarios con passwords hasheados (bcrypt)
   - Actualiza passwords de usuarios existentes

5. **Schema de base de datos** (`/db/schema_usuarios.sql`)
   - Tabla `ll_usuarios` con estructura completa

---

## 📋 Pasos para usar el sistema:

### 1. Crear la tabla de usuarios (si no existe):

```bash
mysql -u root -p tu_base_de_datos < db/schema_usuarios.sql
```

### 2. Crear usuario administrador:

```bash
node scripts/crear_usuario.js b3toh MiPassword123! admin
```

**Salida esperada:**
```
🔐 Creando usuario: b3toh
   Tipo: admin

⏳ Hasheando password...
✅ Password hasheado: $2b$10$abcdef123456...

✅ Usuario creado exitosamente: b3toh

📋 Resumen:
   Usuario: b3toh
   Tipo: admin
   Estado: activo

✨ Listo! Ahora puedes iniciar sesión con estas credenciales.
```

### 3. Crear usuario cliente:

```bash
node scripts/crear_usuario.js habysupply Haby2025! cliente 51
```

**Nota:** El `cliente_id` debe coincidir con el ID del cliente en la base de datos.

### 4. Iniciar sesión:

**POST** `/api/login`
```json
{
  "usuario": "b3toh",
  "password": "MiPassword123!"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "redirect": "/admin/dashboard.html"
}
```

### 5. Cerrar sesión:

**POST** `/api/logout`

**Respuesta:**
```json
{
  "ok": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

## 🔒 Rutas protegidas:

| Ruta | Middleware | Acceso |
|------|-----------|--------|
| `/api/campanias/*` | `requireAuth` | Todos los autenticados |
| `/api/envios/*` | `requireAuth` | Todos los autenticados |
| `/api/generar-envios` | `requireAdmin` | **Solo admin** |
| `/api/lugares/*` | `requireAuth` | Todos los autenticados |
| `/api/rubros/*` | `requireAuth` | Todos los autenticados |
| `/habysupply/api/*` | `requireAuth` | Todos los autenticados |
| `/admin/*` | `requireAuth` | Todos los autenticados |
| `/pm2/*` | `requireAuth` | Todos los autenticados |

---

## 🛡️ Características de seguridad:

- ✅ Passwords hasheados con **bcrypt** (SALT_ROUNDS=10)
- ✅ Sesiones con **express-session**
- ✅ Cookie de sesión con expiración (24 horas)
- ✅ Middleware de autenticación en todas las rutas críticas
- ✅ Control de acceso por roles (admin vs cliente)
- ✅ Logout seguro con destrucción de sesión
- ✅ Sin credenciales hardcodeadas

---

## ⚠️ IMPORTANTE:

### Variables de entorno:

Asegúrate de tener en tu `.env`:

```env
SESSION_SECRET=tu_secret_super_seguro_aqui_cambiar_en_produccion
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=tu_base_de_datos
```

**¡Cambia `SESSION_SECRET` en producción!** Usa un valor aleatorio y seguro:

```bash
# Generar un secret seguro:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📝 Actualizar password de usuario existente:

```bash
# Mismo comando, se actualizará automáticamente
node scripts/crear_usuario.js b3toh NuevoPassword456! admin
```

---

## 🧪 Probar autenticación:

```bash
# 1. Login
curl -X POST http://localhost:3010/api/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"b3toh","password":"MiPassword123!"}'

# 2. Verificar sesión
curl http://localhost:3010/api/usuario-logueado \
  -H "Cookie: connect.sid=<tu-session-cookie>"

# 3. Logout
curl -X POST http://localhost:3010/api/logout \
  -H "Cookie: connect.sid=<tu-session-cookie>"
```

---

## 🔄 Migración de usuarios existentes:

Si ya tenías usuarios con passwords en texto plano, ejecuta:

```bash
# Para cada usuario existente:
node scripts/crear_usuario.js <usuario> <nuevo_password> <tipo> [cliente_id]
```

Esto actualizará el `password_hash` en la base de datos.

---

## ✨ Próximos pasos opcionales:

- [ ] Rate limiting con `express-rate-limit`
- [ ] CSRF protection
- [ ] Helmet.js para headers de seguridad
- [ ] Tokens JWT para API stateless
- [ ] 2FA (autenticación de dos factores)

---

Última actualización: 3 de diciembre de 2025
