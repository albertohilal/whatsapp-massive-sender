require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rutas
app.use('/api/campanias', require('./routes/campanias'));

// Servidor
const PORT = process.env.PORT || 3011;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
