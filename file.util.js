const fs = require('fs');
const path = require('path');

function saveJsonToFile(filename, data) {
  const filePath = path.join(__dirname, 'data', filename);
  const jsonString = JSON.stringify(data, null, 2);

  fs.writeFileSync(filePath, jsonString, 'utf-8');
}

module.exports = {
  saveJsonToFile
};
