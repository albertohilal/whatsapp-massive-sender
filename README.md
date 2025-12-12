# Guía para usuarios de WhatsApp Massive Sender

Estos pasos están pensados para clientes como **Habysupply**, que preparan sus campañas y dejan listo el número de WhatsApp para que el administrador ejecute los envíos. Sigue cada paso en orden y revisa las notas importantes.

---

## 1. Iniciar sesión

1. Ingresa en `http://tuservidor:3010/` con el usuario y contraseña entregados.
2. Serás redirigido al panel de tu cliente (`/habysupply/dashboard.html`).

> **Nota:** Si abres un formulario directamente (por ejemplo `form_campania.html?session=habysupply`), asegúrate de seguir logueado en otra pestaña para que el sistema mantenga tu sesión activa.

---

## 2. Crear o editar campañas

1. En el panel, da clic en **Formulario de campañas**. Se abrirá en otra pestaña (`/form_campania.html?session=habysupply`).
2. Crea una campaña nueva o edita las existentes (solo se pueden editar/eliminar en estado **pendiente**).
3. El mensaje puede usar los placeholders `{{nombre}}`, `{{rubro}}` y `{{direccion}}`, que se reemplazan con los datos reales del destinatario.
4. Guarda los cambios. Si el formulario indica algún error, revisa los campos y vuelve a intentarlo.

> **Tip:** Cada campaña nueva queda asociada automáticamente a tu cliente; no necesitas elegir la sesión de WhatsApp.

---

## 3. Seleccionar prospectos

1. Abre **Seleccionar prospectos** (`/form_envios.html?session=habysupply`).
2. Usa los filtros por rubro, dirección y validez de WhatsApp para encontrar tus contactos.
3. Marca los prospectos deseados y elige la campaña a la que quieres agregarlos.
4. Pulsa “Agregar seleccionados” para generar los envíos pendientes.

Los prospectos que ya tienen envíos pendientes o enviados no aparecerán en la lista, evitando duplicados.

---

## 4. Revisar campañas en detalle

1. Desde el panel principal, haz clic en **Ver campañas** (`/habysupply/campanias.html`).
2. Allí verás todas tus campañas con el conteo de destinatarios.
3. Selecciona una campaña en el desplegable inferior para revisar la tabla de contactos asociados (nombre, teléfono, estado y rubro).

Esta vista es solo de lectura y sirve para confirmar que todo esté listo antes de notificar al administrador.

---

## 5. Mantener la sesión de WhatsApp activa

1. Vuelve al panel (`/habysupply/dashboard.html`).
2. Pulsa **Iniciar sesión WhatsApp** y espera el QR.
3. Escanea el código con el teléfono correspondiente al cliente (por ejemplo, el número de Habysupply).
4. **Deja la sesión abierta** hasta que el administrador confirme que los envíos fueron procesados. Si cierras la sesión o apagas el navegador, el administrador no podrá enviar la campaña.
5. Si necesitas reiniciar el proceso, usa **Cerrar sesión** para limpiar los datos y vuelve a iniciar.

> ⚠️ **Importante:** El administrador depende de que el número esté conectado. Si la sesión se pierde, los envíos no se ejecutarán.

---

## 6. Coordinación con el administrador

- Una vez que las campañas están listas y el WhatsApp permanece conectado, avisa al administrador para que ejecute los envíos.
- El administrador revisará tus campañas, validará los destinatarios y lanzará los mensajes usando tu sesión.

---

## Notas adicionales

- Evita crear campañas en estado distinto a “pendiente” si quieres modificarlas luego. Una vez que el administrador las aprueba o envía, ya no podrás editarlas.
- Si necesitas duplicar una campaña, simplemente crea una nueva con el mismo texto y agrega los destinatarios correspondientes.
- Si el panel muestra “Error consultando estado” en la sección de sesión, intenta recargar la página. Si persiste, contacta al administrador para revisar el servicio de WhatsApp.

---

## Estructura de carpetas y su función

- **bot/**  
  Lógica principal para la integración y manejo de WhatsApp (envío, recepción y gestión de sesiones).

- **campaigns/**  
  Scripts y lógica para la generación y gestión de campañas de envío masivo.

- **clients/**  
  Archivos y configuraciones específicas para clientes (por ejemplo, `habysupply`).

- **controllers/**  
  Controladores de la API y lógica de negocio para manejar las rutas y peticiones del backend.

- **db/**  
  Conexión a la base de datos y archivos de esquema SQL.

- **docs/**  
  Documentación del proyecto (análisis, arquitectura, checklist, etc.).

- **middleware/**  
  Middlewares de Express, como autenticación y validaciones.

- **public/**  
  Archivos estáticos y front-end: HTML, JS y recursos para el panel de administración y formularios.

- **routes/**  
  Definición de rutas de la API y endpoints del backend.

- **scripts/**  
  Scripts utilitarios para mantenimiento, migraciones, análisis y pruebas.

- **services/**  
  Servicios auxiliares y lógica reutilizable (por ejemplo, programadores de tareas).

- **test-results/**  
  Resultados de pruebas automatizadas.

- **tests/**  
  Pruebas automatizadas (unitarias, de integración y end-to-end).
