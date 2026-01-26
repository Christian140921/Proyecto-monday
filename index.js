const { getMondayData } = require('./monday.service');
const { saveJsonToFile } = require('./file.util');
const { savePlainText } = require('./text.util');


async function main() {
  try {
    const data = await getMondayData();

    saveJsonToFile('data/monday-data.json', data);
    savePlainText('data/monday-data.txt', data);

    console.log('✅ JSON y TXT generados correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
