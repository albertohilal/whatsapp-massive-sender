require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');

// Iniciar cliente de WhatsApp
const { iniciarCliente } = require('./bot/whatsapp_instance');
iniciarCliente(); // 🔁 Inicia la conexión con WhatsApp Web


// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
const campaniasRoutes = require('./routes/campanias');
const enviosRoutes = require('./routes/envios');
const generarEnviosRoutes = require('./routes/generar_envios');
const lugaresRoutes = require('./routes/lugares');
const pm2Routes = require('./routes/pm2');
const rubrosRoutes = require('./routes/rubros');
const enviarManualRoutes = require('./routes/enviar_manual');
const marcarEnviadoRoute = require('./routes/marcar_enviado');

app.use('/api/campanias', campaniasRoutes);
app.use('/api/envios', enviosRoutes);
app.use('/api/generar-envios', generarEnviosRoutes);
app.use('/api/lugares', lugaresRoutes);
app.use('/api/rubros', rubrosRoutes);
app.use('/pm2', pm2Routes);
app.use('/api/enviar-manual', enviarManualRoutes);
app.use('/api/marcar-enviado', marcarEnviadoRoute);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Puerto desde .env o 3010 por defecto
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
