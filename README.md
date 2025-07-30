# WhatsApp Massive Sender

Este proyecto permite enviar mensajes de WhatsApp de manera automatizada desde el navegador, utilizando Puppeteer y una base de datos MySQL para gestionar campañas, contactos y envíos.

## 🧱 Estructura del Proyecto

### 📁 `/bot/`
Contiene la lógica del bot de WhatsApp que se conecta con WhatsApp Web mediante Puppeteer y permite enviar mensajes automáticamente.

### 📁 `/campaigns/`
Contiene formularios y vistas web relacionadas con la creación de campañas y el control de los envíos.

- `form_campania.html`: Formulario para crear una nueva campaña.
- `form_envios.html`: Vista para generar envíos en lote desde una campaña existente.
- `form_envios_pendientes.html`: Vista para revisar los mensajes pendientes y enviarlos de manera manual y selectiva.

### 📁 `/controllers/`
Contiene la lógica de negocio para controlar las operaciones de campaña y envíos.

- `enviar_masivo.js`: Controlador principal para generar y enviar mensajes en lote desde campañas, utilizando Puppeteer.

### 📁 `/db/`
Manejo de conexión a la base de datos MySQL.

- `connection.js`: Establece y exporta la conexión a MySQL para todo el sistema.

### 📁 `/public/`
Archivos públicos accesibles desde el navegador (HTML, imágenes, JS del frontend).

### 📁 `/routes/`
Define las rutas del backend (API) para trabajar con campañas, lugares y envíos. A continuación se detalla el propósito de cada archivo:

#### `routes/campanias.js`

- `GET /api/campanias`  
  Devuelve todas las campañas registradas.

- `POST /api/campanias`  
  Crea una nueva campaña en la base de datos.

- `PUT /api/campanias/:id`  
  Actualiza el nombre o contenido de una campaña existente.

- `DELETE /api/campanias/:id`  
  Elimina una campaña y sus envíos relacionados.

#### `routes/lugares.js`

- `GET /api/lugares`  
  Devuelve todos los lugares (destinatarios) almacenados. Se utiliza como fuente para las campañas.

#### `routes/generar_envios.js`

- `POST /api/generar-envios`  
  A partir de una campaña y un conjunto de lugares, genera mensajes personalizados y los guarda con estado `pendiente` en la tabla `ll_envios_whatsapp`.

- `GET /api/pendientes/:campania_id`  
  Devuelve todos los mensajes pendientes (estado `pendiente`) de una campaña específica.

- `POST /api/enviar-masivo-manual`  
  Permite enviar mensajes manualmente seleccionados desde el formulario de pendientes.

---

## 🔌 Base de Datos

Las tablas clave utilizadas en el sistema son:

- `ll_campanias_whatsapp`  
  Contiene las campañas con `id`, `nombre`, `mensaje_base`.

- `ll_envios_whatsapp`  
  Cada registro representa un mensaje a enviar. Tiene `telefono_wapp`, `mensaje_final`, `estado` y `fecha_envio`.

- `ll_lugares`  
  Destinatarios de las campañas. Contiene nombres y teléfonos de contacto.

---

## ▶️ Ejecución del Proyecto

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar archivo `.env` con los datos de conexión a la base de datos.

3. Iniciar el servidor:
   ```bash
   node index.js
   ```

4. Acceder desde el navegador a:
   - `http://localhost:3010/form_campania.html`
   - `http://localhost:3010/form_envios.html`
   - `http://localhost:3010/form_envios_pendientes.html`

---

## ⚠️ Notas

- La autenticación con WhatsApp se realiza escaneando un QR al iniciar el bot.
- Los datos generados en `.wwebjs_auth/` y `.wwebjs_cache/` no deben subirse a GitHub.
