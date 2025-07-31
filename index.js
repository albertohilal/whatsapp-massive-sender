require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');

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

app.use('/api/campanias', campaniasRoutes);
app.use('/api/envios', enviosRoutes);
app.use('/api/generar-envios', generarEnviosRoutes);
app.use('/api/lugares', lugaresRoutes);
app.use('/api/rubros', rubrosRoutes);
app.use('/pm2', pm2Routes);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Puerto desde .env
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
