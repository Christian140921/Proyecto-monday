require('dotenv').config();

const { getMondayData } = require('./services/mondayAPI');
const {
  getActivosDigitalesFromStrapi,
  upsertActivosDigitalesToStrapi,
  deleteMissingActivosDigitales,
} = require('./services/strapiAPI');
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

function uniqueById(items) {
  const seen = new Set();
  const result = [];

  items.forEach((item) => {
    const id = item && item.id ? String(item.id) : null;
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    result.push(item);
  });

  return result;
}


async function main() {
  try {
    const company = 'cristianvargas6322s-team-company';
    const boardId = '18396523890';

    const mondayItemsRaw = await getMondayData();
    const mondayItems = uniqueById(mondayItemsRaw.map((item) => ({
      ...item,
      id: String(item.id),
      url: buildMondayItemUrl({ company, boardId, itemId: String(item.id) }),
    })));

    if (process.env.STRAPI_SYNC === 'true' || process.env.STRAPI_SYNC === '1') {
      try {
        const result = await upsertActivosDigitalesToStrapi(mondayItems);
        console.log(`Strapi sincronizado: ${result.created} creados, ${result.updated} actualizados.`);
      } catch (error) {
        console.warn(`Aviso: no se pudo sincronizar Strapi: ${error.message}`);
      }

      if (process.env.STRAPI_SYNC_DELETE === 'true' || process.env.STRAPI_SYNC_DELETE === '1') {
        try {
          const result = await deleteMissingActivosDigitales(mondayItems.map((item) => item.id));
          console.log(`Strapi limpieza: ${result.deleted} borrados, ${result.skipped} omitidos.`);
        } catch (error) {
          console.warn(`Aviso: no se pudo borrar en Strapi: ${error.message}`);
        }
      }
    }

    let strapiItems = [];
    try {
      const strapiItemsRaw = await getActivosDigitalesFromStrapi();
      strapiItems = uniqueById(strapiItemsRaw
        .filter((item) => item && item.id)
        .map((item) => ({
          ...item,
          id: String(item.id),
          url:
            item.url ||
            buildMondayItemUrl({ company, boardId, itemId: String(item.id) }),
        })));
    } catch (error) {
      console.warn(`Aviso: se omitió Strapi: ${error.message}`);
    }

    saveJsonToFile('data/monday-data.json', mondayItems);
    savePlainText('data/monday-data.txt', mondayItems, { title: 'DATOS DE MONDAY' });

    saveJsonToFile('data/strapi-data.json', strapiItems);
    savePlainText('data/strapi-data.txt', strapiItems, { title: 'DATOS DE STRAPI' });

    saveJsonToFile('data/monday-urls.json', pickUrlList(mondayItems));
    saveJsonToFile('data/strapi-urls.json', pickUrlList(strapiItems));

    console.log('Archivos generados correctamente (Monday; Strapi si está disponible)');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
