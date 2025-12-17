require('dotenv').config();
const connection = require('../db/connection');

async function ensureIndex(table, indexName, createSql, schema) {
  const [rows] = await connection.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [schema, table, indexName]
  );
  if (rows.length === 0) {
    console.log(`➕ Creando índice ${indexName} en ${table}...`);
    await connection.query(createSql);
    console.log(`✅ Índice ${indexName} creado.`);
  } else {
    console.log(`✔️ Índice ${indexName} ya existe en ${table}.`);
  }
}

async function main() {
  const schema = process.env.DB_DATABASE;
  if (!schema) {
    console.error('FALTA DB_DATABASE en .env');
    process.exit(1);
  }

  try {
    // ll_envios_whatsapp
    await ensureIndex(
      'll_envios_whatsapp',
      'idx_envios_lugar_camp_estado',
      `CREATE INDEX idx_envios_lugar_camp_estado ON ll_envios_whatsapp (lugar_id, campania_id, estado)`,
      schema
    );
    await ensureIndex(
      'll_envios_whatsapp',
      'idx_envios_camp_estado',
      `CREATE INDEX idx_envios_camp_estado ON ll_envios_whatsapp (campania_id, estado)`,
      schema
    );

    // ll_lugares_clientes
    await ensureIndex(
      'll_lugares_clientes',
      'idx_lc_cliente_societe',
      `CREATE INDEX idx_lc_cliente_societe ON ll_lugares_clientes (cliente_id, societe_id)`,
      schema
    );
    await ensureIndex(
      'll_lugares_clientes',
      'idx_lc_societe',
      `CREATE INDEX idx_lc_societe ON ll_lugares_clientes (societe_id)`,
      schema
    );

    // ll_societe_extended
    await ensureIndex(
      'll_societe_extended',
      'idx_se_societe',
      `CREATE INDEX idx_se_societe ON ll_societe_extended (societe_id)`,
      schema
    );
    await ensureIndex(
      'll_societe_extended',
      'idx_se_rubro',
      `CREATE INDEX idx_se_rubro ON ll_societe_extended (rubro_id)`,
      schema
    );

    // ll_rubros
    await ensureIndex(
      'll_rubros',
      'idx_rubros_area',
      `CREATE INDEX idx_rubros_area ON ll_rubros (area)`,
      schema
    );
    await ensureIndex(
      'll_rubros',
      'idx_rubros_nombre_es',
      `CREATE INDEX idx_rubros_nombre_es ON ll_rubros (nombre_es)`,
      schema
    );

    console.log('🎉 Optimización de índices completada.');
  } catch (err) {
    console.error('❌ Error aplicando índices:', err);
    process.exit(2);
  } finally {
    await connection.end();
  }
}

main();
