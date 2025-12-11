#!/bin/bash

# Script de verificación pre-deploy
# Verifica que todo esté listo antes de hacer deploy a producción

echo "🚀 PRE-DEPLOY CHECK"
echo "═══════════════════════════════════════════════════"
echo ""

# Test 1: Integridad de base de datos
echo "📋 1. Verificando integridad de base de datos..."
node scripts/test_ll_societe_extended.js
if [ $? -ne 0 ]; then
  echo "❌ Test de integridad falló. ABORTANDO DEPLOY."
  exit 1
fi
echo ""

# Test 2: Git status limpio
echo "📋 2. Verificando estado de Git..."
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Hay cambios sin commitear:"
  git status --short
  echo ""
  read -p "¿Continuar de todas formas? (s/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Deploy cancelado por usuario."
    exit 1
  fi
else
  echo "✅ Repositorio limpio"
fi
echo ""

# Test 3: Verificar que estamos en main
echo "📋 3. Verificando rama actual..."
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "⚠️  No estás en la rama main (actual: $BRANCH)"
  read -p "¿Continuar de todas formas? (s/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Deploy cancelado por usuario."
    exit 1
  fi
else
  echo "✅ En rama main"
fi
echo ""

# Test 4: Verificar que estamos sincronizados con origin
echo "📋 4. Verificando sincronización con origin..."
git fetch origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
if [ $LOCAL != $REMOTE ]; then
  echo "⚠️  Tu rama local no está sincronizada con origin"
  echo "   Ejecuta: git pull o git push"
  exit 1
else
  echo "✅ Sincronizado con origin"
fi
echo ""

# Test 5: npm dependencies
echo "📋 5. Verificando dependencias npm..."
if [ -f "package.json" ]; then
  if [ ! -d "node_modules" ]; then
    echo "❌ Falta carpeta node_modules. Ejecuta: npm install"
    exit 1
  fi
  echo "✅ node_modules existe"
else
  echo "⚠️  No se encontró package.json"
fi
echo ""

# Test 6: .env file
echo "📋 6. Verificando archivo .env..."
if [ ! -f ".env" ]; then
  echo "❌ Falta archivo .env"
  exit 1
fi
echo "✅ Archivo .env existe"
echo ""

echo "═══════════════════════════════════════════════════"
echo "✅ TODOS LOS CHECKS PASARON - OK PARA DEPLOY"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📝 Próximos pasos para deploy a Contabo:"
echo "   1. ssh user@contabo-ip"
echo "   2. cd /ruta/del/proyecto"
echo "   3. git pull"
echo "   4. node scripts/ejecutar_crear_societe_extended.js (solo primera vez)"
echo "   5. node scripts/recrear_ll_lugares_clientes.js"
echo "   6. pm2 restart all"
echo "   7. pm2 logs --lines 50"
echo ""
