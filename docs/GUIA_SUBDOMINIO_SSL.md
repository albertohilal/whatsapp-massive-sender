# Guía para publicar whatsapp-massive-sender en un subdominio con SSL

## Objetivo

Publicar el proyecto ubicado en `/root/whatsapp-massive-sender` bajo el subdominio:

    https://massive.desarrolloydisenioweb.com.ar

con certificado SSL válido y proxy inverso.

---

## 1. Crear el subdominio en DNS

- Ingresa al panel de tu proveedor de dominio.
- Crea un registro tipo A:
  - **Nombre:** massive.desarrolloydisenioweb.com.ar
  - **Destino:** 209.126.4.25
- Espera a que la propagación DNS se complete (puede tardar minutos u horas).

---

## 2. Configurar Nginx como proxy inverso

1. Crea el archivo de configuración para el subdominio:

```bash
sudo nano /etc/nginx/sites-available/massive-desarrolloydisenioweb
```

2. Agrega el siguiente contenido:

```nginx
server {
    listen 80;
    server_name massive.desarrolloydisenioweb.com.ar;

    location / {
        proxy_pass http://localhost:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Activa el sitio y recarga Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/massive-desarrolloydisenioweb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. Instalar SSL con Let’s Encrypt

1. Instala certbot si no lo tienes:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

2. Ejecuta el siguiente comando para obtener el certificado SSL:

```bash
sudo certbot --nginx -d massive.desarrolloydisenioweb.com.ar
```

3. Sigue las instrucciones en pantalla para completar la instalación.

---

## 4. Verifica el acceso

- Accede a: https://massive.desarrolloydisenioweb.com.ar
- Debes ver la interfaz de whatsapp-massive-sender funcionando bajo SSL.

---

## Notas
- Asegúrate de que el backend esté corriendo en el puerto 3010.
- Si cambias el puerto, actualiza la configuración de Nginx.
- Puedes repetir este proceso para otros subdominios y proyectos.

---

**Fin de la guía**
