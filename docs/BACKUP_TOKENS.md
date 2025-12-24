# Sistema de Backup Automático de Tokens de WhatsApp

## Descripción

Sistema automatizado para realizar backups diarios de los tokens de sesión de WhatsApp, garantizando la continuidad del servicio en caso de pérdida de datos o necesidad de restauración.

## Ubicaciones

### Tokens Originales
```
/root/whatsapp-massive-sender/tokens/
├── haby/
│   ├── session/          # Sesión de Chrome/WhatsApp Web
│   ├── Default/          # Perfil de Chrome con cookies y datos
│   ├── SingletonLock     # Archivo de bloqueo
│   └── ...               # Otros archivos de configuración
```

### Backups
```
/root/backups/whatsapp-tokens/
├── tokens_backup_20251224_053421.tar.gz
├── tokens_backup_20251223_030000.tar.gz
└── ... (últimos 7 backups)
```

### Logs
```
/var/log/whatsapp-backup.log
```

## Script de Backup

**Ubicación:** `/root/whatsapp-massive-sender/scripts/backup-tokens.sh`

### Funcionalidades

1. **Backup Comprimido:** Crea archivo `.tar.gz` con fecha y hora
2. **Rotación Automática:** Mantiene solo los últimos 7 backups
3. **Logs Detallados:** Registra cada operación en log file
4. **Verificación:** Confirma éxito o error de cada backup

### Ejecución Manual

```bash
cd /root/whatsapp-massive-sender
bash scripts/backup-tokens.sh
```

## Programación Automática

### Cron Job Configurado

```cron
0 3 * * * /root/whatsapp-massive-sender/scripts/backup-tokens.sh >> /var/log/whatsapp-backup.log 2>&1
```

- **Frecuencia:** Diario
- **Hora:** 3:00 AM
- **Zona horaria:** Servidor (UTC)

### Verificar Configuración

```bash
# Ver cron jobs activos
crontab -l

# Ver logs recientes
tail -f /var/log/whatsapp-backup.log
```

## Restauración de Backup

### Procedimiento Completo

1. **Detener el servicio de WhatsApp:**
   ```bash
   pm2 stop whatsapp-massive-sender
   ```

2. **Backup de seguridad (opcional pero recomendado):**
   ```bash
   mv /root/whatsapp-massive-sender/tokens /root/whatsapp-massive-sender/tokens.old
   ```

3. **Crear directorio limpio:**
   ```bash
   mkdir -p /root/whatsapp-massive-sender/tokens
   ```

4. **Restaurar backup seleccionado:**
   ```bash
   # Ver backups disponibles
   ls -lh /root/backups/whatsapp-tokens/
   
   # Restaurar backup específico
   tar -xzf /root/backups/whatsapp-tokens/tokens_backup_YYYYMMDD_HHMMSS.tar.gz \
       -C /root/whatsapp-massive-sender/tokens/
   ```

5. **Reiniciar el servicio:**
   ```bash
   pm2 restart whatsapp-massive-sender
   ```

6. **Verificar estado:**
   ```bash
   pm2 logs whatsapp-massive-sender --lines 50
   ```

### Ejemplo de Restauración

```bash
# Detener servicio
pm2 stop whatsapp-massive-sender

# Restaurar backup del día anterior
tar -xzf /root/backups/whatsapp-tokens/tokens_backup_20251223_030000.tar.gz \
    -C /root/whatsapp-massive-sender/tokens/

# Reiniciar
pm2 restart whatsapp-massive-sender

# Verificar
pm2 logs whatsapp-massive-sender --lines 50 --nostream
```

## Monitoreo

### Verificar Último Backup

```bash
# Ver backups ordenados por fecha
ls -lt /root/backups/whatsapp-tokens/ | head -5

# Ver tamaño de backups
du -sh /root/backups/whatsapp-tokens/*
```

### Verificar Logs

```bash
# Ver últimas ejecuciones
tail -50 /var/log/whatsapp-backup.log

# Buscar errores
grep -i error /var/log/whatsapp-backup.log

# Seguir logs en tiempo real
tail -f /var/log/whatsapp-backup.log
```

## Mantenimiento

### Cambiar Frecuencia de Backup

```bash
# Editar crontab
crontab -e

# Ejemplos de frecuencias:
# Cada 6 horas:  0 */6 * * *
# Cada 12 horas: 0 */12 * * *
# Dos veces al día: 0 3,15 * * *
```

### Cambiar Retención de Backups

Editar el script `/root/whatsapp-massive-sender/scripts/backup-tokens.sh`:

```bash
# Cambiar el número 8 por (N+1) donde N = backups a mantener
ls -t tokens_backup_*.tar.gz | tail -n +8 | xargs -r rm
#                                              ^
#                                    Para 10 backups: usar +11
```

### Backup Manual Antes de Cambios Críticos

```bash
# Crear backup con nombre descriptivo
cd /root/whatsapp-massive-sender/tokens
tar -czf /root/backups/whatsapp-tokens/tokens_backup_pre_upgrade_$(date +%Y%m%d_%H%M%S).tar.gz .
```

## Solución de Problemas

### Error: "No space left on device"

```bash
# Ver espacio disponible
df -h

# Limpiar backups antiguos manualmente
cd /root/backups/whatsapp-tokens/
ls -t tokens_backup_*.tar.gz | tail -n +4 | xargs rm
```

### Error: "Permission denied"

```bash
# Verificar permisos del script
ls -l /root/whatsapp-massive-sender/scripts/backup-tokens.sh

# Dar permisos de ejecución
chmod +x /root/whatsapp-massive-sender/scripts/backup-tokens.sh
```

### Backup No Se Ejecuta Automáticamente

```bash
# Verificar que cron está corriendo
systemctl status cron

# Verificar sintaxis del crontab
crontab -l

# Ver logs de cron
grep CRON /var/log/syslog | tail -20
```

## Consideraciones de Seguridad

1. **Permisos Restringidos:**
   - Los backups contienen tokens de autenticación sensibles
   - Solo root debe tener acceso: `chmod 600 backup_file.tar.gz`

2. **Ubicación Segura:**
   - Considerar backups offsite para disaster recovery
   - No subir backups a repositorios públicos

3. **Encriptación (Opcional):**
   ```bash
   # Backup encriptado con GPG
   tar -czf - tokens/ | gpg -c > backup_encrypted.tar.gz.gpg
   ```

## Respaldo en Otro Servidor (Opcional)

### Usar rsync para Backup Remoto

```bash
# Agregar al crontab después del backup local
rsync -avz --delete /root/backups/whatsapp-tokens/ \
    user@backup-server:/backups/whatsapp-tokens/
```

## Contacto y Soporte

Para problemas con el sistema de backup:
1. Verificar logs: `/var/log/whatsapp-backup.log`
2. Revisar espacio en disco: `df -h`
3. Verificar permisos y propietario de archivos

---

**Última actualización:** 24/12/2025  
**Versión:** 1.0
