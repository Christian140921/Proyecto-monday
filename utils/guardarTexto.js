const fs = require('fs');
const path = require('path');

function savePlainText(filePath, data) {
  const fullPath = path.resolve(filePath);
  const boardId = '18396523890';
  const company = 'cristianvargas6322s-team-company';

  let content = 'DATOS DE MONDAY\n\n';

  data.forEach((item, index) => {
    content += `Registro ${index + 1}\n`;
    for (const key in item) {
      content += `${key}: ${item[key]}\n`;
    }
    const itemUrl = `https://${company}.monday.com/boards/${boardId}/pulses/${item.id}`;
    content += `URL: ${itemUrl}\n`;
    content += '\n------------------\n\n';
  });

  fs.writeFileSync(fullPath, content, 'utf-8');
}

module.exports = { savePlainText };

