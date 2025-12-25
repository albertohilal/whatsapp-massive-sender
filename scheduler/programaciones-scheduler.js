const connection = require('../db/connection');

// Configurar zona horaria de Buenos Aires
process.env.TZ = 'America/Argentina/Buenos_Aires';

const DAY_MAP = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
};

// Función para pausar entre envíos
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para verificar si estamos en horario de envío
function estaEnHorario(programacion, now) {
  const horaActual = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  const diaActual = DAY_MAP[now.getDay()];
  
  // Verificar si el día actual está en los días programados
  const diasProgramados = programacion.dias_semana.split(',').map(d => d.trim());
  if (!diasProgramados.includes(diaActual)) {
    return false;
  }
  
  // Verificar si estamos en el rango de horas
  if (horaActual < programacion.hora_inicio || horaActual >= programacion.hora_fin) {
    return false;
  }
  
  // Verificar si estamos en el rango de fechas
  const fechaActual = now.toISOString().split('T')[0];
  if (fechaActual < programacion.fecha_inicio) {
    return false;
  }
  if (programacion.fecha_fin && fechaActual > programacion.fecha_fin) {
    return false;
  }
  
  return true;
}

// Función para obtener el cliente de WhatsApp según el nombre de sesión
async function obtenerClienteWhatsApp(sessionName) {
  // Hacer una llamada HTTP al endpoint del servidor principal
  const axios = require('axios');
  return {
    sendMessage: async (chatId, message) => {
      // Usar el endpoint de envío manual del servidor principal
      const response = await axios.post('http://localhost:3011/api/enviar-manual-directo', {
        telefono: chatId.replace('@c.us', ''),
        mensaje: message,
        session: sessionName
      });
      return response.data;
    }
  };
}

// Función principal para procesar programaciones
async function procesarProgramaciones() {
  const now = new Date();
  console.log(`\n🕐 [${now.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}] Verificando programaciones...`);
  
  try {
    // Obtener programaciones aprobadas
    const [programaciones] = await connection.query(`
      SELECT p.*, c.nombre as campania_nombre, u.usuario as sesion_cliente
      FROM ll_programaciones p
      INNER JOIN ll_campanias_whatsapp c ON p.campania_id = c.id
      INNER JOIN ll_usuarios u ON p.cliente_id = u.cliente_id AND u.tipo = 'cliente'
      WHERE p.estado = 'aprobada'
      ORDER BY p.id
    `);
    
    if (programaciones.length === 0) {
      console.log('ℹ️  No hay programaciones aprobadas');
      return;
    }
    
    console.log(`📋 Encontradas ${programaciones.length} programaciones aprobadas`);
    
    for (const prog of programaciones) {
      // Verificar si estamos en horario
      if (!estaEnHorario(prog, now)) {
        console.log(`⏭️  Campaña ${prog.campania_id} fuera de horario`);
        continue;
      }
      
      console.log(`✅ Campaña ${prog.campania_id} (${prog.campania_nombre}) en horario de envío`);
      
      // Obtener mensajes pendientes
      const [mensajes] = await connection.query(`
        SELECT id, telefono_wapp, mensaje_final 
        FROM ll_envios_whatsapp 
        WHERE campania_id = ? AND estado = 'pendiente'
        ORDER BY id ASC
        LIMIT ?
      `, [prog.campania_id, prog.cupo_diario]);
      
      if (mensajes.length === 0) {
        console.log(`ℹ️  No hay mensajes pendientes para la campaña ${prog.campania_id}`);
        continue;
      }
      
      console.log(`📤 Enviando ${mensajes.length} mensajes para campaña ${prog.campania_id}`);
      
      const sessionName = prog.sesion_cliente ? prog.sesion_cliente.toLowerCase() : 'haby';
      let enviados = 0;
      let errores = 0;
      
      try {
        const clienteWA = await obtenerClienteWhatsApp(sessionName);
        
        for (const msg of mensajes) {
          try {
            const chatId = msg.telefono_wapp.includes('@c.us') 
              ? msg.telefono_wapp 
              : `${msg.telefono_wapp}@c.us`;
            
            await clienteWA.sendMessage(chatId, msg.mensaje_final);
            
            // Actualizar estado en la base de datos
            await connection.query(
              'UPDATE ll_envios_whatsapp SET estado = "enviado", fecha_envio = NOW() WHERE id = ?',
              [msg.id]
            );
            
            enviados++;
            console.log(`  ✓ Mensaje ${msg.id} enviado a ${msg.telefono_wapp}`);
            
            // Delay aleatorio entre 5 y 15 segundos
            const delay = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
            await sleep(delay);
            
          } catch (error) {
            errores++;
            console.error(`  ✗ Error enviando mensaje ${msg.id}:`, error.message);
          }
        }
        
        console.log(`📊 Resultado campaña ${prog.campania_id}: ${enviados} enviados, ${errores} errores`);
        
      } catch (error) {
        console.error(`❌ Error obteniendo cliente WhatsApp para sesión '${sessionName}':`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error procesando programaciones:', error);
  }
}

// Ejecutar cada 5 minutos
console.log('🚀 Scheduler de programaciones iniciado');
console.log(`⏰ Zona horaria: ${process.env.TZ}`);
console.log('📅 Se ejecutará cada 5 minutos');

// Ejecutar inmediatamente al iniciar
procesarProgramaciones();

// Luego ejecutar cada 5 minutos
setInterval(procesarProgramaciones, 5 * 60 * 1000);
