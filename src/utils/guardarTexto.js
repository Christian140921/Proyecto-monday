const fs = require('fs');
const path = require('path');

function savePlainText(filePath, data, options = {}) {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const fullPath = path.resolve(projectRoot, filePath);

  const title = options.title || 'DATOS';
  const columns = ['id', 'nombre', 'estado', 'categoria', 'costo', 'fecha', 'url'];
  
  // Calcular ancho máximo para cada columna
  const colWidths = {};
  columns.forEach(col => {
    colWidths[col] = Math.max(col.length, 15);
    data.forEach(item => {
      const value = String(item[col] || '').substring(0, 50);
      colWidths[col] = Math.max(colWidths[col], value.length);
    });
  });

  // Crear separador
  const separator = '+' + columns.map(col => '-'.repeat(colWidths[col] + 2)).join('+') + '+';
  
  // Crear header
  let content = `\n${title}\n\n${separator}\n`;
  content += '| ' + columns.map(col => col.padEnd(colWidths[col])).join(' | ') + ' |\n';
  content += separator + '\n';

  // Agregar filas
  data.forEach(item => {
    const row = columns.map(col => {
      const value = String(item[col] || '').substring(0, colWidths[col]);
      return value.padEnd(colWidths[col]);
    });
    content += '| ' + row.join(' | ') + ' |\n';
  });

  content += separator + '\n\n';
  content += `Total: ${data.length} registros\n`;

  fs.writeFileSync(fullPath, content, 'utf-8');
}

module.exports = { savePlainText };

