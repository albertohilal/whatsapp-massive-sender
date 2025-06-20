# 📦 whatsapp-massive-sender

Sistema de envío masivo de mensajes de WhatsApp basado en `whatsapp-web.js` y `MySQL`.

## 🚀 Funcionalidades
- Crear campañas desde formulario web
- Generar mensajes personalizados (`{{nombre}}`, `{{rubro}}`)
- Enviar mensajes masivos desde tabla `ll_envios_whatsapp`
- Registrar estado (`pendiente`, `enviado`, `error`)

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
Configurar .env:

ini
Copiar
Editar
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_clave
DB_DATABASE=iunaorg_dyd
DB_PORT=3306
PORT=3000
🧪 Uso
Iniciar servidor web:

bash
Copiar
Editar
node index.js
Abrir navegador: http://localhost:3000/form_campania.html

Crear campaña

Generar envíos con:

bash
Copiar
Editar
node campaigns/generar_envios.js
Enviar mensajes pendientes:

bash
Copiar
Editar
node controllers/enviar_masivo.js
🛠 Tablas necesarias en MySQL
sql
Copiar
Editar
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
📎 Licencia
MIT