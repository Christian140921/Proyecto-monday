const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const mondayPath = path.join(__dirname, '..', 'data', 'monday-data.txt');
const strapiPath = path.join(__dirname, '..', 'data', 'strapi-data.txt');

app.get('/download', (req, res) => {
  const monday = fs.existsSync(mondayPath) ? fs.readFileSync(mondayPath, 'utf-8') : '(no hay datos)';
  const strapi = fs.existsSync(strapiPath) ? fs.readFileSync(strapiPath, 'utf-8') : '(no hay datos)';

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="datos-monday-strapi.txt"');
  res.send(monday + '\n\n====================\n\n' + strapi);
});

app.get('/download-monday', (req, res) => {
  const monday = fs.existsSync(mondayPath) ? fs.readFileSync(mondayPath, 'utf-8') : '(no hay datos)';
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="monday-data.txt"');
  res.send(monday);
});

app.get('/download-strapi', (req, res) => {
  const strapi = fs.existsSync(strapiPath) ? fs.readFileSync(strapiPath, 'utf-8') : '(no hay datos)';
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="strapi-data.txt"');
  res.send(strapi);
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
