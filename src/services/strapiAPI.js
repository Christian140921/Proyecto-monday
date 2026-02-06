const PAGE_SIZE = 100;

function getStrapiConfig() {
  const baseUrl = (process.env.STRAPI_BASE_URL || 'http://localhost:1337').replace(/\/$/, '');
  const path = process.env.STRAPI_ACTIVO_DIGITAL_PATH || '/api/activo-digital';
  const token = process.env.STRAPI_API_TOKEN;

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return { baseUrl, path, headers };
}

async function hacerRequest(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(`No se pudo conectar con Strapi (${url}).`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Strapi error HTTP ${response.status}. ${body.slice(0, 200)}`);
  }

  // DELETE y algunas respuestas vienen vacías
  const text = await response.text().catch(() => '');
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeRow(row) {
  const source = row.attributes || row;
  const mondayId = source.id_monday || source.idMonday;

  return {
    id: mondayId ? String(mondayId) : row.id ? String(row.id) : undefined,
    nombre: source.Nombre || source.nombre || null,
    estado: source.Estado || source.estado || null,
    categoria: source.Categoria || source.categoria || null,
    costo: source.Costo || source.costo || null,
    fecha: source.Fecha || source.fecha || null,
    url: source.URL || source.url || null,
    __entryId: row.id,
    __documentId: row.documentId || source.documentId,
  };
}

async function getActivosDigitalesFromStrapi() {
  const { baseUrl, path, headers } = getStrapiConfig();
  const url = process.env.STRAPI_DATA_URL || `${baseUrl}${path}?pagination[pageSize]=${PAGE_SIZE}`;

  const payload = await hacerRequest(url, { headers });
  const rows = Array.isArray(payload) ? payload : (payload?.data || []);
  return rows.map(normalizeRow);
}

async function fetchAllStrapiEntries() {
  const { baseUrl, path, headers } = getStrapiConfig();
  const todos = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${baseUrl}${path}?pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`;
    const payload = await hacerRequest(url, { headers });
    const rows = payload?.data || [];

    todos.push(...rows);
    totalPages = payload?.meta?.pagination?.pageCount || 1;
    page++;
  }

  return todos;
}

function armarPayload(item) {
  return {
    id_monday: item.id || null,
    Nombre: item.nombre || null,
    Estado: item.estado || null,
    Categoria: item.categoria || null,
    Costo: item.costo || null,
    Fecha: item.fecha || null,
    URL: item.url || null,
  };
}

async function upsertActivosDigitalesToStrapi(items) {
  const { baseUrl, path, headers } = getStrapiConfig();

  if (!headers.Authorization) {
    throw new Error('STRAPI_API_TOKEN no está configurado.');
  }

  // Traer lo que ya existe en Strapi para saber si crear o actualizar
  const existentes = await fetchAllStrapiEntries();
  const porMondayId = {};
  existentes.forEach((row) => {
    const n = normalizeRow(row);
    if (n.id) {
      porMondayId[String(n.id)] = {
        entryId: n.__entryId,
        documentId: n.__documentId,
      };
    }
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item || !item.id) continue;

    const body = JSON.stringify({ data: armarPayload(item) });
    const existe = porMondayId[String(item.id)];
    const targetId = existe?.documentId || existe?.entryId;

    if (!targetId) {
      // No existe, crear
      const url = `${baseUrl}${path}`;
      await hacerRequest(url, { method: 'POST', headers, body });
      created++;
      continue;
    }

    // Existe, actualizar
    const url = `${baseUrl}${path}/${targetId}`;
    try {
      await hacerRequest(url, { method: 'PUT', headers, body });
      updated++;
    } catch (err) {
      // Strapi v5 rechaza PUT, probar PATCH
      if (String(err.message).includes('405')) {
        try {
          await hacerRequest(url, { method: 'PATCH', headers, body });
          updated++;
        } catch {
          skipped++;
          console.warn(`No se pudo actualizar ${item.id}`);
        }
      } else {
        throw err;
      }
    }
  }

  return { created, updated, skipped };
}

async function deleteMissingActivosDigitales(mondayIds) {
  const { baseUrl, path, headers } = getStrapiConfig();

  if (!headers.Authorization) {
    throw new Error('STRAPI_API_TOKEN no está configurado.');
  }

  const existentes = await fetchAllStrapiEntries();
  const idsMonday = new Set(mondayIds.map(String));

  let deleted = 0;
  let skipped = 0;

  for (const row of existentes) {
    const n = normalizeRow(row);
    const id = n.id ? String(n.id) : null;

    // Si está en Monday, no borrar
    if (!id || idsMonday.has(id)) continue;

    const targetId = n.__documentId || n.__entryId;
    if (!targetId) {
      skipped++;
      continue;
    }

    try {
      const url = `${baseUrl}${path}/${targetId}`;
      await hacerRequest(url, { method: 'DELETE', headers });
      deleted++;
    } catch (err) {
      // Si no se puede borrar con documentId, intentar con entryId
      if (n.__entryId && n.__documentId && n.__entryId !== n.__documentId) {
        try {
          const url = `${baseUrl}${path}/${n.__entryId}`;
          await hacerRequest(url, { method: 'DELETE', headers });
          deleted++;
        } catch {
          skipped++;
        }
      } else {
        skipped++;
      }
    }
  }

  return { deleted, skipped };
}

module.exports = {
  getActivosDigitalesFromStrapi,
  upsertActivosDigitalesToStrapi,
  deleteMissingActivosDigitales,
};
