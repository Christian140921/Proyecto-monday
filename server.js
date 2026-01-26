const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.get('/download', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'monday-data.txt');
  res.download(filePath, 'monday-data.txt');
});

app.listen(PORT, () => {
  console.log(`📥 Servidor activo en http://localhost:${PORT}`);
});
