const { getMondayData } = require('./services/mondayAPI');
const { saveJsonToFile } = require('./utils/guardarJSON');
const { savePlainText } = require('./utils/guardarTexto');


async function main() {
  try {
    const data = await getMondayData();

    saveJsonToFile('data/monday-data.json', data);
    savePlainText('data/monday-data.txt', data);

    console.log('JSON y TXT generados correctamente');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
