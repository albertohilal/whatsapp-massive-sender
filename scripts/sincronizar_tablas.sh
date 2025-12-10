#!/bin/bash
# Sincronización automática de tablas y diagnóstico

LOGDIR="$(dirname "$0")/../logs"
LOGFILE="$LOGDIR/sincronizacion.log"

mkdir -p "$LOGDIR"

{
  echo "----- $(date) -----"
  echo "Ejecutando repoblado de ll_lugares_clientes..."
    node scripts/recrear_ll_lugares_clientes.js
  echo "Ejecutando diagnóstico de sincronización..."
    node scripts/diagnostico_sincronizacion.js
  echo "Sincronización y diagnóstico completados."
  echo ""
} >> "$LOGFILE" 2>&1
