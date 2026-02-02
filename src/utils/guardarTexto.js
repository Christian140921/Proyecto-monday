const fs = require('fs');
const path = require('path');

function savePlainText(filePath, data, options = {}) {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const fullPath = path.resolve(projectRoot, filePath);

  const title = options.title || 'DATOS';
  let content = `${title}\n\n`;

  data.forEach((item, index) => {
    content += `Registro ${index + 1}\n`;
    for (const key in item) {
      content += `${key}: ${item[key]}\n`;
    }
    content += '\n------------------\n\n';
  });

  fs.writeFileSync(fullPath, content, 'utf-8');
}

module.exports = { savePlainText };

