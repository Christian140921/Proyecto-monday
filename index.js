const { getMondayData } = require('./services/mondayAPI');
const { getActivosDigitalesFromStrapi } = require('./services/strapiAPI');
const { saveJsonToFile } = require('./utils/guardarJSON');
const { savePlainText } = require('./utils/guardarTexto');

function buildMondayItemUrl({ company, boardId, itemId }) {
  return `https://${company}.monday.com/boards/${boardId}/pulses/${itemId}`;
}

function pickUrlList(items) {
  return items
    .filter((i) => i && i.id && i.url)
    .map((i) => ({ id: String(i.id), url: String(i.url) }));
}


async function main() {
  try {
    const company = 'cristianvargas6322s-team-company';
    const boardId = '18396523890';

    const mondayItemsRaw = await getMondayData();
    const mondayItems = mondayItemsRaw.map((item) => ({
      ...item,
      id: String(item.id),
      url: buildMondayItemUrl({ company, boardId, itemId: String(item.id) }),
    }));

    let strapiItems = [];
    try {
      const strapiItemsRaw = await getActivosDigitalesFromStrapi();
      strapiItems = strapiItemsRaw
        .filter((item) => item && item.id)
        .map((item) => ({
          ...item,
          id: String(item.id),
          url:
            item.url ||
            buildMondayItemUrl({ company, boardId, itemId: String(item.id) }),
        }));
    } catch (error) {
      console.warn(`Aviso: se omitió Strapi: ${error.message}`);
    }

    saveJsonToFile('data/monday-data.json', mondayItems);
    savePlainText('data/monday-data.txt', mondayItems);

    saveJsonToFile('data/strapi-data.json', strapiItems);
    savePlainText('data/strapi-data.txt', strapiItems);

    saveJsonToFile('data/monday-urls.json', pickUrlList(mondayItems));
    saveJsonToFile('data/strapi-urls.json', pickUrlList(strapiItems));

    console.log('Archivos generados correctamente (Monday; Strapi si está disponible)');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
