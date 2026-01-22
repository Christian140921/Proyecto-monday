const { getMondayData } = require('./monday.service');
const { saveJsonToFile } = require('./file.util');

async function main() {
  try {
    const data = await getMondayData();
    saveJsonToFile('monday-data.json', data);
    console.log('✅ Datos guardados correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

