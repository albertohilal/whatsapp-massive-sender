# Panel independiente para Habysupply

Esta carpeta contiene la lógica, vistas y documentación específica para el cliente Habysupply. Aquí se gestionan campañas, prospectos y envíos de forma aislada.

- Acceso: usuario/contraseña
- Panel: dashboard, campañas, prospectos, envíos
- Controladores y rutas dedicadas
- Compatible para despliegue en Contabo

## Roles del flujo

- **Cliente (Habysupply o futuros clientes de marca blanca)**  
  Responsable de crear campañas, seleccionar prospectos y dejar la sesión de WhatsApp lista. No ejecuta el envío masivo.

- **Administrador (b3toh u otro operador interno)**  
  Aprueba las campañas, controla los envíos y monitorea las sesiones desde el panel principal.

## Pasos para el cliente

1. **Inicio de sesión**  
   Ingresar en `http://tuservidor:3010/` con el usuario/contraseña asignados (tipo `cliente`). Esto abre el dashboard limpio de Habysupply.

2. **Crear campaña**  
   - Desde el botón “Formulario de campañas” o directamente en el card de “Campañas registradas”.  
   - Completar nombre y mensaje (con placeholders si aplica).  
   - Cada campaña queda asociada automáticamente al `cliente_id` del usuario.

3. **Seleccionar prospectos**  
- Abrir “Seleccionar prospectos” (`/form_envios.html` o desde el botón del panel).
   - Filtrar por rubro/dirección y marcar los contactos deseados.  
   - Los envíos generados quedan ligados a la campaña y al `cliente_id`.

4. **Iniciar sesión de WhatsApp**  
   - En el dashboard usar “Iniciar sesión WhatsApp”.  
   - Escanear el QR cuando la librería lo solicite (se guarda en `tokens/<cliente>`).  
   - Mantener la sesión activa hasta que el administrador confirme el envío.

5. **Esperar confirmación**  
   El equipo administrador revisa, aprueba y ejecuta la campaña usando la sesión del cliente. Cualquier envío manual o masivo se registra desde el panel general.

## Recomendaciones para futuros clientes

- Crear un usuario `ll_usuarios` con `tipo='cliente'` y asignar su `cliente_id`.
- Generar una carpeta `tokens/<cliente>` para la sesión de `whatsapp-web.js`.  
- Personalizar el dashboard en `public/<cliente>/` siguiendo el patrón actual: botones de sesión + accesos rápidos a los formularios estándar (`form_campania.html?session=<cliente>` y `form_envios.html`), de modo que la sesión correspondiente se preseleccione automáticamente.
- Documentar el flujo de trabajo en un README similar a este para facilitar el onboarding.
