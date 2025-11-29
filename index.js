
require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/auth');

const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const requireAuth = (req, res, next) => {
  if (req.session && req.session.usuario) {
    return next();
  }
  return res.status(401).json({ ok: false, error: 'No autenticado' });
};

// Iniciar cliente de WhatsApp
const { iniciarCliente } = require('./bot/whatsapp_instance');
// El cliente de WhatsApp solo se inicia bajo demanda por endpoint

// Middlewares
app.use(cors());
app.use(express.json());
const habysupplyRouter = require('./routes/habysupply');
const adminRouter = require('./routes/admin');
// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rutas API y paneles antes de archivos estáticos y ruta principal
app.use('/api', authRoutes);
const campaniasRoutes = require('./routes/campanias');
app.use('/api/campanias', requireAuth, campaniasRoutes);
const enviosRoutes = require('./routes/envios');
app.use('/api/envios', requireAuth, enviosRoutes);
const generarEnviosRoutes = require('./routes/generar_envios');
app.use('/api/generar-envios', requireAuth, generarEnviosRoutes);
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
// Servir archivos estáticos de habysupply antes de cualquier router o middleware
app.use('/habysupply-static', express.static(path.join(__dirname, 'public/habysupply')));

// Resto de middlewares y routers
// Solo rutas API para /habysupply, no archivos estáticos
app.use('/habysupply/api', habysupplyRouter);
app.use('/admin', requireAuth, adminRouter);

// Servir archivos estáticos sin sobrescribir la ruta principal
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Ruta principal (HTML base) al final
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Puerto desde .env o por defecto en 3010
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
