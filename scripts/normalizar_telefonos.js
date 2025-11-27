// Script para normalizar teléfonos en ll_lugares
// Convierte números locales a formato internacional argentino (549...)

const pool = require('../db/connection');

function normalizarTelefono(telefono) {
  if (!telefono) return '';
  let t = telefono.replace(/\D/g, ''); // Solo dígitos
  // Si ya está en formato internacional
  if (/^549\d{10}$/.test(t)) return t;
  // Si empieza con 15 y tiene 8 dígitos (ej: 1534567890)
  if (/^15\d{8}$/.test(t)) return '549' + t.slice(2);
  // Si tiene 10 dígitos (ej: 2345678901)
  if (/^\d{10}$/.test(t)) return '549' + t;
  // Si tiene 8 dígitos (línea local)
  if (/^\d{8}$/.test(t)) return '54911' + t; // Asume CABA (11)
  // Si tiene 11 dígitos y empieza con 9 (ej: 91123456789)
  if (/^9\d{10}$/.test(t)) return '549' + t.slice(1);
  return '';
}

async function main() {
  const conn = await pool.getConnection();
  const [lugares] = await conn.query('SELECT id, telefono_wapp FROM ll_lugares');
  let actualizados = 0;
  for (const lugar of lugares) {
    const normalizado = normalizarTelefono(lugar.telefono_wapp);
    if (normalizado && normalizado !== lugar.telefono_wapp) {
      await conn.query('UPDATE ll_lugares SET telefono_wapp = ? WHERE id = ?', [normalizado, lugar.id]);
      actualizados++;
      console.log(`ID ${lugar.id}: ${lugar.telefono_wapp} -> ${normalizado}`);
    }
  }
  conn.release();
  console.log(`Teléfonos normalizados: ${actualizados}`);
  process.exit(0);
}

main();
