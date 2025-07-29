
# 📦 whatsapp-massive-sender

Sistema de envío masivo de mensajes de WhatsApp basado en `whatsapp-web.js` y `MySQL`.

## 🚀 Funcionalidades

- Crear campañas desde un formulario web tipo CRUD.
- Visualizar, editar y eliminar campañas existentes.
- Generar mensajes personalizados usando variables (`{{nombre}}`, `{{rubro}}`).
- Enviar mensajes masivos desde la tabla `ll_envios_whatsapp`.
- Registro automático del estado del envío (`pendiente`, `enviado`, `error`).
- Configuración multientorno (`.env`), con puertos diferenciados para desarrollo local y producción.

## 📦 Requisitos

- Node.js 18+
- MySQL 5.7+
- Google Chrome o Chromium instalado (para escanear el QR)
- WhatsApp activo con número argentino (`54911xxxx`)

## ⚙️ Instalación

```bash
git clone https://github.com/tuusuario/whatsapp-massive-sender.git
cd whatsapp-massive-sender
npm install
```

### Configurar `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_clave
DB_DATABASE=iunaorg_dyd
DB_PORT=3306
PORT=3010
```

## 🧪 Uso

### Iniciar servidor web:

```bash
node index.js
```

Abrir navegador en:

```
http://localhost:3010/form_campania.html
```

Desde allí podrás:

- Crear una nueva campaña.
- Editar campañas existentes.
- Visualizar mensajes de cada campaña.

### Generar envíos automáticos:

```bash
node campaigns/generar_envios.js
```

### Enviar mensajes pendientes:

```bash
node controllers/enviar_masivo.js
```

## 🛠 Tablas necesarias en MySQL

```sql
CREATE TABLE ll_campanias_whatsapp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  mensaje TEXT,
  estado VARCHAR(20),
  fecha_creacion DATETIME
);

CREATE TABLE ll_envios_whatsapp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campania_id INT,
  telefono VARCHAR(20),
  nombre_destino VARCHAR(100),
  mensaje_final TEXT,
  estado VARCHAR(20),
  fecha_envio DATETIME
);

CREATE TABLE ll_lugares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  telefono VARCHAR(20),
  rubro_id INT
);

CREATE TABLE ll_rubros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100)
);
```

## 📝 Estado `pendiente`

Cuando se crea una campaña, los envíos asociados se cargan en la tabla `ll_envios_whatsapp` con estado `pendiente`. Esto indica que el mensaje aún no fue enviado. Al ejecutar `enviar_masivo.js`, estos registros se procesan y actualizan a `enviado` o `error`.

## 📎 Licencia

MIT
