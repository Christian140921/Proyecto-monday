const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

function readTextOrFallback(filePath, fallbackTitle) {
  return fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf-8')
    : `${fallbackTitle}\n\n(no hay datos)\n`;
}

function sendText(res, filename, content) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(content);
}

app.get('/download', (req, res) => {
  const mondayPath = path.join(__dirname, '..', 'data', 'monday-data.txt');
  const strapiPath = path.join(__dirname, '..', 'data', 'strapi-data.txt');

  const mondayContent = readTextOrFallback(mondayPath, 'DATOS DE MONDAY');
  const strapiContent = readTextOrFallback(strapiPath, 'DATOS DE STRAPI');

  const content = `${mondayContent}\n\n====================\n\n${strapiContent}`;
  return sendText(res, 'datos-monday-strapi.txt', content);
});

app.get('/download-monday', (req, res) => {
  const mondayPath = path.join(__dirname, '..', 'data', 'monday-data.txt');
  const mondayContent = readTextOrFallback(mondayPath, 'DATOS DE MONDAY');
  return sendText(res, 'monday-data.txt', mondayContent);
});

app.get('/download-strapi', (req, res) => {
  const strapiPath = path.join(__dirname, '..', 'data', 'strapi-data.txt');
  const strapiContent = readTextOrFallback(strapiPath, 'DATOS DE STRAPI');
  return sendText(res, 'strapi-data.txt', strapiContent);
});

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});
