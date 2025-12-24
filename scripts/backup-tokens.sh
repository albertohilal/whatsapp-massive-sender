#!/bin/bash
# Script de backup automático de tokens de WhatsApp
# Guarda en: /root/backups/whatsapp-tokens/

BACKUP_DIR="/root/backups/whatsapp-tokens"
TOKENS_DIR="/root/whatsapp-massive-sender/tokens"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="tokens_backup_${DATE}.tar.gz"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Crear backup comprimido
echo "🔄 Iniciando backup de tokens de WhatsApp..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" -C "$TOKENS_DIR" .

if [ $? -eq 0 ]; then
    echo "✅ Backup creado exitosamente: ${BACKUP_NAME}"
    
    # Mantener solo los últimos 7 backups
    echo "🧹 Limpiando backups antiguos..."
    cd "$BACKUP_DIR"
    ls -t tokens_backup_*.tar.gz | tail -n +8 | xargs -r rm
    
    echo "📊 Backups actuales:"
    ls -lh tokens_backup_*.tar.gz 2>/dev/null || echo "   (este es el primer backup)"
else
    echo "❌ Error al crear backup"
    exit 1
fi

echo "✨ Proceso completado"
