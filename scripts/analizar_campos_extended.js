// Script para analizar qué campos custom necesitamos en ll_societe_extended
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
  });

  console.log('\n=== ANÁLISIS: Campos custom necesarios en ll_societe_extended ===\n');

  // 1. Analizar campos de ll_lugares que podrían ser útiles
  console.log('1️⃣  CAMPOS DE ll_lugares que NO están en llxbx_societe:');
  const [camposLugares] = await conn.query('DESCRIBE ll_lugares');
  const [camposSociete] = await conn.query('DESCRIBE llxbx_societe');
  
  const camposSocieteSet = new Set(camposSociete.map(c => c.Field.toLowerCase()));
  const camposUnicos = camposLugares.filter(c => {
    const field = c.Field.toLowerCase();
    return !['id', 'place_id', 'created_at', 'ref_ext'].includes(field) && 
           !camposSocieteSet.has(field);
  });
  
  console.table(camposUnicos.map(c => ({
    campo: c.Field,
    tipo: c.Type,
    utilidad: getUtilidadCampo(c.Field)
  })));

  // 2. Campos que tenemos en ll_lugares con datos
  console.log('\n2️⃣  ESTADÍSTICAS DE CAMPOS EN ll_lugares:');
  for (const campo of ['rubro_id', 'zona_id', 'rating', 'reviews', 'precio', 'abierto', 'wapp_valido', 'origen']) {
    try {
      const [stats] = await conn.query(`
        SELECT 
          '${campo}' AS campo,
          COUNT(*) AS total,
          COUNT(${campo}) AS con_valor,
          ROUND(COUNT(${campo}) * 100.0 / COUNT(*), 2) AS porcentaje_con_valor
        FROM ll_lugares
      `);
      console.table(stats);
    } catch (err) {
      console.log(`  ⚠️  Campo ${campo} no existe o error`);
    }
  }

  // 3. Analizar ll_lugares_haby
  console.log('\n3️⃣  CAMPOS ÚNICOS EN ll_lugares_haby:');
  try {
    const [camposHaby] = await conn.query('DESCRIBE ll_lugares_haby');
    const camposUnicosHaby = camposHaby.filter(c => {
      const field = c.Field.toLowerCase();
      return !['id', 'created_at', 'ref_ext'].includes(field) && 
             !camposSocieteSet.has(field);
    });
    console.table(camposUnicosHaby.map(c => ({
      campo: c.Field,
      tipo: c.Type
    })));
  } catch (err) {
    console.log('  ⚠️  Error analizando ll_lugares_haby');
  }

  // 4. Analizar uso actual en queries
  console.log('\n4️⃣  CAMPOS MÁS USADOS EN NUESTRAS CONSULTAS ACTUALES:');
  console.log(`
    Campos que actualmente consultamos:
    - nom (nombre) ✅ en llxbx_societe
    - address (dirección) ✅ en llxbx_societe  
    - phone_mobile (teléfono WhatsApp) ✅ en llxbx_societe
    - rubro ❌ NO está (necesitamos rubro_id)
    - estado (calculado, no almacenado)
    - wapp_valido ❌ NO está
  `);

  await conn.end();

  console.log('\n=== RECOMENDACIÓN DE ESTRUCTURA ll_societe_extended ===\n');
  console.log(`
CREATE TABLE ll_societe_extended (
  -- Clave primaria
  societe_id INT(11) NOT NULL PRIMARY KEY COMMENT 'FK a llxbx_societe.rowid',
  
  -- Campos de negocio
  rubro_id INT(11) NULL COMMENT 'FK a ll_rubros.id - Categoría del negocio',
  zona_id INT(11) NULL COMMENT 'FK a ll_zonas.id - Zona geográfica',
  
  -- Campos de validación/calidad
  wapp_valido TINYINT(1) DEFAULT 1 COMMENT '1=teléfono WhatsApp validado',
  origen VARCHAR(50) NULL COMMENT 'Fuente: google_places, haby, manual, etc',
  
  -- Campos de Google Places (si aplica)
  rating DECIMAL(2,1) NULL COMMENT 'Calificación de Google (0.0-5.0)',
  reviews INT(11) NULL COMMENT 'Número de reseñas en Google',
  precio TINYINT(4) NULL COMMENT 'Nivel de precio (1-4)',
  abierto TINYINT(1) NULL COMMENT '1=actualmente abierto según Google',
  
  -- Campos de control
  sincronizado_at TIMESTAMP NULL COMMENT 'Última sincronización desde origen',
  verificado_at TIMESTAMP NULL COMMENT 'Última verificación manual',
  
  -- Campos de auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_rubro (rubro_id),
  INDEX idx_zona (zona_id),
  INDEX idx_origen (origen),
  INDEX idx_wapp_valido (wapp_valido),
  INDEX idx_rating (rating),
  
  -- Foreign keys
  FOREIGN KEY (societe_id) REFERENCES llxbx_societe(rowid) ON DELETE CASCADE,
  FOREIGN KEY (rubro_id) REFERENCES ll_rubros(id) ON DELETE SET NULL,
  FOREIGN KEY (zona_id) REFERENCES ll_zonas(id) ON DELETE SET NULL
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
COMMENT='Extensión custom de llxbx_societe con campos adicionales de negocio';
  `);

  console.log('\n=== CAMPOS PRIORIZADOS (Implementación Mínima) ===\n');
  console.log(`
VERSIÓN MÍNIMA para empezar:

CREATE TABLE ll_societe_extended (
  societe_id INT(11) NOT NULL PRIMARY KEY,
  rubro_id INT(11) NULL COMMENT 'FK a ll_rubros.id',
  origen VARCHAR(50) NULL COMMENT 'Fuente de datos',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rubro (rubro_id),
  FOREIGN KEY (societe_id) REFERENCES llxbx_societe(rowid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

Agregar más campos después según necesidad.
  `);
}

function getUtilidadCampo(campo) {
  const utilidades = {
    'rubro': '⭐⭐⭐ Necesario para filtrado/visualización',
    'rubro_id': '⭐⭐⭐ Necesario para filtrado/visualización',
    'zona_id': '⭐⭐ Útil para segmentación geográfica',
    'rating': '⭐⭐ Útil para scoring/priorización',
    'reviews': '⭐⭐ Útil para scoring/priorización',
    'precio': '⭐ Puede ser útil para segmentación',
    'abierto': '⭐ Información complementaria',
    'tipos': '⭐ Información complementaria',
    'wapp_valido': '⭐⭐⭐ Necesario para validación',
    'origen': '⭐⭐ Útil para auditoría/trazabilidad'
  };
  return utilidades[campo] || '❓ A evaluar';
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
