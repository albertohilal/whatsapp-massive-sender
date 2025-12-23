# Puerto por defecto del backend

El backend de whatsapp-massive-sender ahora utiliza el puerto **3011** por defecto (ver `index.js`):

- Esto evita conflictos con leadmaster-central-hub, que usa el puerto 3010.
- Si necesitas cambiar el puerto, puedes definir la variable de entorno `PORT` al iniciar el servidor.

**Ejemplo:**

```
PORT=3012 node index.js
```

> Última actualización: junio 2024
