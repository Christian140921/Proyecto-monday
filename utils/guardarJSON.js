const fs = require('fs');
const path = require('path');

function saveJsonToFile(filePath, data) {
  const fullPath = path.resolve(filePath);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { saveJsonToFile };
