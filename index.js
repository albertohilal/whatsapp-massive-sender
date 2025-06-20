require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

const campaniasRouter = require('./routes/campanias');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/campanias', campaniasRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
