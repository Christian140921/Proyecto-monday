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

    const strapiItemsRaw = await getActivosDigitalesFromStrapi();
    const strapiItems = strapiItemsRaw
      .filter((item) => item && item.id)
      .map((item) => ({
        ...item,
        id: String(item.id),
        url:
          item.url ||
          buildMondayItemUrl({ company, boardId, itemId: String(item.id) }),
      }));

    saveJsonToFile('data/monday-data.json', mondayItems);
    savePlainText('data/monday-data.txt', mondayItems);

    saveJsonToFile('data/strapi-data.json', strapiItems);
    savePlainText('data/strapi-data.txt', strapiItems);

    saveJsonToFile('data/monday-urls.json', pickUrlList(mondayItems));
    saveJsonToFile('data/strapi-urls.json', pickUrlList(strapiItems));

    console.log('Archivos generados correctamente (Monday y Strapi)');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
