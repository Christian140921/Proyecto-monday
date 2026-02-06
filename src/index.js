require('dotenv').config();

const { getMondayData } = require('./services/mondayAPI');
const {
  getActivosDigitalesFromStrapi,
  upsertActivosDigitalesToStrapi,
  deleteMissingActivosDigitales,
} = require('./services/strapiAPI');
const { saveJsonToFile } = require('./utils/guardarJSON');
const { savePlainText } = require('./utils/guardarTexto');

function buildMondayItemUrl(company, boardId, itemId) {
  return `https://${company}.monday.com/boards/${boardId}/pulses/${itemId}`;
}

function pickUrlList(items) {
  return items
    .filter((i) => i && i.id && i.url)
    .map((i) => ({ id: String(i.id), url: String(i.url) }));
}

function getColumnTextByTitle(item, title) {
  const cols = item && Array.isArray(item.column_values) ? item.column_values : [];
  const col = cols.find((c) => c && c.column && c.column.title === title);
  const text = col ? col.text : null;
  if (text === '' || text == null) {
    return null;
  }
  return text;
}

function numberFromText(text) {
  if (text == null) {
    return 0;
  }
  const n = Number(String(text).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function normalizeMondayItem(item) {
  const idFromColumn = getColumnTextByTitle(item, 'item id');
  const idValue = item?.id ?? item?.id_monday ?? item?.idMonday ?? idFromColumn;
  const nombreValue =
    item?.nombre ?? item?.Nombre ?? item?.name ?? getColumnTextByTitle(item, 'Registro');
  const estadoValue = item?.estado ?? item?.Estado ?? getColumnTextByTitle(item, 'Estado');
  const categoriaValue =
    item?.categoria ?? item?.Categoria ?? getColumnTextByTitle(item, 'Categoria');
  const costoValue =
    item?.costo != null
      ? item.costo
      : item?.Costo != null
        ? item.Costo
        : numberFromText(getColumnTextByTitle(item, 'Costo'));
  const fechaValue =
    item?.fecha ?? item?.Fecha ?? getColumnTextByTitle(item, 'Fecha de Registro');

  return {
    ...item,
    id: idValue != null ? String(idValue) : undefined,
    nombre: nombreValue ?? null,
    estado: estadoValue ?? null,
    categoria: categoriaValue ?? null,
    costo: costoValue ?? 0,
    fecha: fechaValue ?? null,
  };
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
    const company = process.env.MONDAY_COMPANY || 'christian110721s-team';
    const boardId = process.env.MONDAY_BOARD_ID || '18398967831';

    const mondayItemsRaw = await getMondayData();
    const mondayItems = uniqueById(mondayItemsRaw.map((item) => {
      const normalized = normalizeMondayItem(item);
      const url = normalized.url ||
        (normalized.id
          ? buildMondayItemUrl(company, boardId, String(normalized.id))
          : null);

      return {
        ...normalized,
        url: url || undefined,
      };
    }));

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
            buildMondayItemUrl(company, boardId, String(item.id)),
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
