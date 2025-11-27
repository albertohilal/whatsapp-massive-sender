// Script para normalizar teléfonos en ll_lugares
// Convierte números locales a formato internacional argentino (549...)

const pool = require('../db/connection');

function normalizarTelefono(telefono) {
  if (!telefono || typeof telefono !== 'string') return '';
  let t = telefono;
  // Paso 0: Procesar formato '(11) xxxx-xxxx', '(11) xxxxx-xxxx', '(11) xxxxxxx-xxxx', etc.
  // Si el formato es '(11) xxxxx-xxxx' o '(11) xxxx-xxxx', lo convertimos a '11915778872'
  t = t.replace(/^\(11\)\s*(\d{4,7})-(\d{4})$/, function(_, pre, parte1, parte2) {
    return '11' + parte1 + parte2;
  });
  // Si el número empieza con '11' y tiene 8 o más dígitos después, lo normalizamos como CABA
  if (/^11\d{8,9}$/.test(t)) {
    let lastDigits = t.slice(2);
    return '54911' + lastDigits;
  }
  // Paso 1: Reemplazar '011 15-' o '01115-' por '011'
  t = t.replace(/011\s*15-/, '011-');
  t = t.replace(/01115-/, '011-');
  // Paso 1b: Procesar otros códigos de área con formato 'XXXX XX-XXXX'
  // Ejemplo: '02224 54-4245' => '02224544245'
  t = t.replace(/^(\d{4,5})\s*(\d{2})-(\d{4})$/, function(_, codArea, prefijo, linea) {
    return codArea + prefijo + linea;
  });
  // Paso 2: Eliminar espacios y guiones
  t = t.replace(/\s+/g, '');
  t = t.replace(/-/g, '');
  // Si el número empieza con '011' y tiene 8 dígitos después (ej: 01160116550)
  if (/^011\d{8}$/.test(t)) {
    const last8 = t.slice(-8);
    return '54911' + last8;
  }
  // Si el número empieza con otro código de área (4 o 5 dígitos) y tiene 6 o 7 dígitos después
  if (/^(\d{4,5})(\d{6,7})$/.test(t)) {
    return '549' + t;
  }
  // Solo dígitos para la lógica de normalización
  let digits = t.replace(/\D/g, '');
  // Si ya está en formato internacional
  if (/^549\d{10}$/.test(digits)) return digits;
  // Si empieza con 11 y tiene 8 dígitos (ej: 11xxxxxxx)
  if (/^11\d{8}$/.test(digits)) return '54911' + digits.slice(2);
  // Si empieza con 15 y tiene 8 dígitos (ej: 1512345678)
  if (/^15\d{8}$/.test(digits)) return '54911' + digits.slice(2);
  // Si tiene 10 dígitos (ej: 2345678901)
  if (/^\d{10}$/.test(digits)) return '549' + digits;
  // Si tiene 8 dígitos (línea local)
  if (/^\d{8}$/.test(digits)) return '54911' + digits; // Asume CABA (11)
  // Si tiene 11 dígitos y empieza con 9 (ej: 91123456789)
  if (/^9\d{10}$/.test(digits)) return '549' + digits.slice(1);
  // Si tiene 12 dígitos y empieza con 54 (ej: 5411xxxxxxx)
  if (/^54\d{10}$/.test(digits)) return '549' + digits.slice(2);
  // Si tiene 7 dígitos (línea local sin código)
  if (/^\d{7}$/.test(digits)) return '';
  return '';
}

async function main() {
  const conn = await pool.getConnection();
  const [lugares] = await conn.query('SELECT id, telefono, telefono_wapp FROM ll_lugares WHERE telefono_wapp IS NULL');
  let actualizados = 0;
  for (const lugar of lugares) {
    const normalizado = normalizarTelefono(lugar.telefono);
    // Actualiza siempre si hay teléfono original y se puede normalizar
    if (lugar.telefono && normalizado) {
      await conn.query('UPDATE ll_lugares SET telefono_wapp = ? WHERE id = ?', [normalizado, lugar.id]);
      actualizados++;
      console.log(`ID ${lugar.id}: ${lugar.telefono} -> ${normalizado}`);
    }
  }
  conn.release();
  console.log(`Teléfonos normalizados y copiados a telefono_wapp: ${actualizados}`);
  process.exit(0);
}

main();
