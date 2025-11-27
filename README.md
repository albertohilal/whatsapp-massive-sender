# WhatsApp Massive Sender

Este proyecto permite enviar mensajes de WhatsApp de manera automatizada desde el navegador, utilizando Puppeteer y una base de datos MySQL para gestionar campañas, contactos y envíos.

## 🧱 Estructura del Proyecto

### 📁 `/bot/`
Contiene la lógica del bot de WhatsApp que se conecta con WhatsApp Web mediante Puppeteer y permite enviar mensajes automáticamente.

### 📁 `/campaigns/`
Contiene formularios y vistas web relacionadas con la creación de campañas y el control de los envíos.

- `form_campania.html`: Formulario para crear una nueva campaña.
- `form_envios.html`: **MEJORADO:** Vista para seleccionar y agregar prospectos a campañas con filtros avanzados (rubro, dirección, WhatsApp válido).
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

- `PUT /api/lugares/:id`  
  Permite editar los datos de un lugar.

- `DELETE /api/lugares/:id`  
  Permite eliminar un lugar.

#### `routes/envios.js`

- `GET /api/envios/filtrar-prospectos`  
  **NUEVA FUNCIONALIDAD:** Filtra prospectos disponibles para campañas. Permite filtrar por rubro, dirección y validez de WhatsApp. Excluye automáticamente lugares que ya tienen envíos pendientes o enviados.

- `POST /api/envios/agregar-a-campania`  
  **NUEVA FUNCIONALIDAD:** Agrega prospectos seleccionados a una campaña específica. Personaliza automáticamente los mensajes con placeholders `{{nombre}}`, `{{rubro}}` y `{{direccion}}`.

- `GET /api/envios`  
  Obtiene todos los envíos del sistema.

- `GET /api/envios/campania/:id`  
  Obtiene envíos específicos de una campaña.

- `GET /api/envios/pendientes`  
  Obtiene todos los envíos pendientes del sistema.

- `GET /api/envios/estadisticas/:campania_id`  
  Obtiene estadísticas de envíos para una campaña específica.

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
  Contiene las campañas con `id`, `nombre`, `mensaje` (plantilla con placeholders).

- `ll_envios_whatsapp`  
  Cada registro representa un mensaje a enviar. Incluye `telefono_wapp`, `mensaje_final` (personalizado), `estado`, `fecha_envio` y `lugar_id` para referencia.

- `ll_lugares`  
  Destinatarios de las campañas. Contiene `nombre`, `telefono_wapp`, `direccion`, `rubro_id` y `wapp_valido` que indica si el número es válido en WhatsApp.

- `ll_rubros`  
  Categorías de los lugares. Contiene `id` y `nombre_es` para clasificar los prospectos.

### 🆕 Funcionalidades de Filtrado Inteligente

El sistema ahora incluye filtrado avanzado que:
- **Excluye automáticamente** lugares que ya tienen envíos pendientes o enviados
- **Filtra por rubro** (ej: "rest" para restaurantes)
- **Filtra por dirección** (ej: "Lanús" para ubicaciones específicas)
- **Solo números válidos** de WhatsApp cuando se selecciona la opción
- **Personalización automática** de mensajes con `{{nombre}}`, `{{rubro}}`, `{{direccion}}`

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
   - `http://localhost:3010/form_campania.html` - Crear campañas
   - `http://localhost:3010/form_envios.html` - **MEJORADO:** Seleccionar prospectos con filtros avanzados
   - `http://localhost:3010/form_envios_pendientes.html` - Gestionar envíos pendientes

### 🎯 Flujo de Trabajo Recomendado

1. **Crear una campaña** en `/form_campania.html`
   - Define el nombre y mensaje con placeholders `{{nombre}}`, `{{rubro}}`, `{{direccion}}`

2. **Agregar prospectos** en `/form_envios.html`
   - Filtra por rubro (ej: "rest" para restaurantes)
   - Filtra por ubicación (ej: "Lanús")
   - Selecciona solo números válidos de WhatsApp
   - Selecciona prospectos específicos y agrégalos a la campaña

3. **Gestionar envíos** en `/form_envios_pendientes.html`
   - Revisa los mensajes personalizados generados
   - Envía de manera selectiva o masiva

---

## 🆕 Últimas Mejoras Implementadas

### ✅ Sistema de Filtrado Inteligente
- **Filtrado automático**: Excluye lugares que ya tienen envíos pendientes o enviados
- **Filtros dinámicos**: Por rubro, dirección y validez de WhatsApp
- **Interfaz mejorada**: Selección múltiple con checkboxes y contadores en tiempo real

### ✅ Gestión Avanzada de Prospectos
- **Agregado selectivo**: Selecciona prospectos específicos para cada campaña
- **Personalización automática**: Los mensajes se personalizan automáticamente con datos del prospecto
- **Validación robusta**: Verificación de datos y manejo de errores mejorado

### ✅ Mejoras en la Base de Datos
- **Consultas optimizadas**: Uso de JOIN y alias para evitar ambigüedades
- **Integridad referencial**: Relaciones mejoradas entre tablas
- **Logging detallado**: Registro completo de operaciones para debugging

### ✅ Interfaz de Usuario
- **Mensajes de estado**: Feedback visual del estado de las operaciones
- **Filtros en tiempo real**: Resultados actualizados dinámicamente
- **Diseño responsivo**: Compatible con diferentes tamaños de pantalla

---

## 🛠️ Verificación de números válidos de WhatsApp


Para verificar automáticamente si los números en la tabla `ll_lugares` son válidos en WhatsApp y actualizar el campo `wapp_valido`, puedes ejecutar el script en dos modos:

**Solo lugares no verificados (recomendado):**
```bash
node scripts/verificar_wapp_lugares.js
```
Verifica únicamente los lugares donde `wapp_valido` es `NULL` o `-1` (no verificados o pendientes), acelerando el proceso.

**Verificar toda la base:**
```bash
node scripts/verificar_wapp_lugares.js all
```
Verifica todos los lugares, sin importar el estado de `wapp_valido`.

Ambos modos recorren los registros en tandas de 50, dejando un tiempo de espera entre tandas. El campo `wapp_valido` se marca como `1` si el número es válido, `0` si no lo es o está vacío/incorrecto. El script es independiente del servidor principal (`index.js`).

**Parámetro opcional:**
- Sin parámetro: solo lugares no verificados.
- Con parámetro `all`: toda la base.

---

## ⚠️ Notas

- **Autenticación con WhatsApp**: El sistema utiliza WhatsApp Web a través del navegador. La primera vez requiere escanear el código QR.
- **Gestión de sesión**: Las sesiones se mantienen activas automáticamente.
- **Rate limiting**: Se recomienda no enviar más de 50 mensajes por minuto para evitar bloqueos.
- **Personalización**: Los mensajes soportan placeholders `{{nombre}}`, `{{rubro}}` y `{{direccion}}` que se reemplazan automáticamente.

⚠️ Este proyecto contiene dependencias con vulnerabilidades conocidas. Se ha decidido mantener las versiones actuales por compatibilidad con `venom-bot` y `whatsapp-web.js`. Se revisará periódicamente la posibilidad de actualizar sin romper funcionalidad.
