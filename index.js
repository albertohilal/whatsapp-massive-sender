require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rutas
app.use('/api/campanias', require('./routes/campanias'));
app.use('/api/generar-envios', require('./routes/generar_envios'));
app.use('/api/lugares', require('./routes/lugares'));
app.use('/api', require('./routes/envios')); // ✅ esta es la que faltaba

// Servidor
const PORT = process.env.PORT || 3011;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
