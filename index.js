
require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
winston.configure({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const helmet = require('helmet');
const authRoutes = require('./routes/auth');

// Seguridad: headers seguros con Helmet
app.use(helmet());


const session = require('express-session');
let RedisStore;
let redisClient;
let sessionStore;
try {
  const { RedisStore } = require('connect-redis');
  const { createClient } = require('redis');
  redisClient = createClient({
    legacyMode: true,
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  redisClient.connect().catch(console.error);
  sessionStore = new RedisStore({ client: redisClient });
  winston.info('Redis configurado como store de sesiones.');
} catch (e) {
  console.warn('Redis no está disponible, usando store en memoria.');
  console.error('Error de conexión a Redis:', e);
}

// Asegurarse de que en producción exista una SESSION_SECRET
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET no está definido en producción. Defínelo en .env');
  process.exit(1);
}

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // evitar crear sesiones vacías
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS en producción
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Importar middlewares de autenticación
const { requireAuth, requireAdmin, requireCliente } = require('./middleware/requireAuth');

// Iniciar cliente de WhatsApp
const { iniciarCliente } = require('./bot/whatsapp_instance');
// El cliente de WhatsApp solo se inicia bajo demanda por endpoint

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false
}));
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CORS_ORIGIN || 'https://tudominio.com']
  : ['http://localhost:3010'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
const habysupplyRouter = require('./routes/habysupply');
const adminRouter = require('./routes/admin');
const marketingRouter = require('./routes/marketing');
const habyRouter = require('./routes/haby');
// Middleware de logging para debug
// Logging profesional
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rutas API y paneles antes de archivos estáticos y ruta principal
app.use('/api', authRoutes);
const campaniasRoutes = require('./routes/campanias');
app.use('/api/campanias', requireAuth, campaniasRoutes);
const enviosRoutes = require('./routes/envios');
app.use('/api/envios', requireAuth, enviosRoutes);
const generarEnviosRoutes = require('./routes/generar_envios');
app.use('/api/generar-envios', requireAdmin, generarEnviosRoutes);
const lugaresRoutes = require('./routes/lugares');
app.use('/api/lugares', requireAuth, lugaresRoutes);
const rubrosRoutes = require('./routes/rubros');
app.use('/api/rubros', requireAuth, rubrosRoutes);
const pm2Routes = require('./routes/pm2');
app.use('/pm2', requireAuth, pm2Routes);
const enviarManualRoutes = require('./routes/enviar_manual');
app.use('/api/enviar-manual', requireAuth, enviarManualRoutes);
const marcarEnviadoRoute = require('./routes/marcar_enviado');
app.use('/api/marcar-enviado', requireAuth, marcarEnviadoRoute);
const sesionesRoutes = require('./routes/sesiones');
app.use('/api/sesiones', requireAuth, sesionesRoutes);
const botResponderRoutes = require('./routes/bot_responder');
app.use('/api/bot-responder', requireAuth, botResponderRoutes);
const usuariosRoutes = require('./routes/usuarios');
app.use('/api/usuarios', requireAdmin, usuariosRoutes);
const programacionesRoutes = require('./routes/programaciones');
app.use('/api/programaciones', requireAuth, programacionesRoutes);
// Servir archivos estáticos de habysupply antes de cualquier router o middleware
app.use('/habysupply-static', express.static(path.join(__dirname, 'public/habysupply')));

// Resto de middlewares y routers
// Solo rutas API para /habysupply y /marketing, no archivos estáticos
app.use('/habysupply/api', requireAuth, habysupplyRouter);
app.use('/marketing', requireAuth, marketingRouter);
app.use('/haby', requireAuth, habyRouter);
app.use('/admin', requireAuth, adminRouter);

// Servir archivos estáticos sin sobrescribir la ruta principal
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Ruta principal (HTML base) al final
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const programacionScheduler = require('./services/programacionScheduler');
programacionScheduler.start();

// Puerto desde .env o por defecto en 3010
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  winston.info(`Servidor corriendo en http://localhost:${PORT}`);
});
