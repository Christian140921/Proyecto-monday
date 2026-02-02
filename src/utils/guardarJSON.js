const fs = require('fs');
const path = require('path');

function saveJsonToFile(filePath, data) {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const fullPath = path.resolve(projectRoot, filePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { saveJsonToFile };
