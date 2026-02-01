const DEFAULT_PAGE_SIZE = 100;

function getStrapiConfig() {
  const baseUrl = (process.env.STRAPI_BASE_URL || 'http://localhost:1337').replace(/\/$/, '');
  const path = (process.env.STRAPI_ACTIVO_DIGITAL_PATH || '/api/activo-digital').replace(/^([^/])/, '/$1');

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const token = process.env.STRAPI_API_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return { baseUrl, path, headers };
}

function normalizeRow(row) {
  const source = row && typeof row === 'object' ? row.attributes || row : {};

  const idFromMonday = source.id_monday ?? source.idMonday ?? source.id_lunes ?? source.idLunes;
  const idFallback = row && row.id != null ? row.id : source.id;
  const documentId = row && row.documentId ? row.documentId : source.documentId;

  return {
    id: idFromMonday != null ? String(idFromMonday) : idFallback != null ? String(idFallback) : undefined,
    nombre: source.nombre ?? source.Nombre ?? null,
    estado: source.estado ?? source.Estado ?? null,
    categoria: source.categoria ?? source.Categoria ?? null,
    costo: source.costo ?? source.Costo ?? null,
    fecha: source.fecha ?? source.Fecha ?? null,
    url: source.url ?? source.URL ?? null,
    __entryId: row && row.id != null ? row.id : undefined,
    __documentId: documentId,
  };
}

async function getActivosDigitalesFromStrapi() {
  const directUrl = process.env.STRAPI_DATA_URL;
  const { baseUrl, path, headers } = getStrapiConfig();
  const endpoint = directUrl || `${baseUrl}${path}?pagination%5BpageSize%5D=${DEFAULT_PAGE_SIZE}`;

  let response;
  try {
    response = await fetch(endpoint, { headers });
  } catch (error) {
    throw new Error(
      `No se pudo conectar con Strapi en ${baseUrl}. ` +
        'Asegúrate de que Strapi esté corriendo y accesible (por defecto http://localhost:1337), ' +
        'o configura STRAPI_BASE_URL.'
    );
  }

  if (!response.ok) {
    let details = '';
    try {
      const text = await response.text();
      details = text ? ` Detalles: ${text.slice(0, 300)}` : '';
    } catch {
      // ignore
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Strapi respondió ${response.status} (no autorizado). ` +
          'Si tu endpoint no es público, crea un API Token en Strapi y configura STRAPI_API_TOKEN.' +
          details
      );
    }

    throw new Error(`Error al obtener datos desde Strapi (HTTP ${response.status}).${details}`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.strapi)
      ? payload.strapi
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  return rows.map((row) => {
    const normalized = normalizeRow(row);
    delete normalized.__entryId;
    return normalized;
  });
}

async function fetchAllStrapiEntries() {
  const { baseUrl, path, headers } = getStrapiConfig();
  const items = [];
  let page = 1;
  let pageCount = 1;

  while (page <= pageCount) {
    const endpoint = `${baseUrl}${path}?pagination%5Bpage%5D=${page}&pagination%5BpageSize%5D=${DEFAULT_PAGE_SIZE}`;
    const response = await fetch(endpoint, { headers });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Error al leer Strapi para sincronizar (HTTP ${response.status}). ${text}`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    items.push(...rows);

    pageCount = payload?.meta?.pagination?.pageCount || 1;
    page += 1;
  }

  return items;
}

function toStrapiPayload(item) {
  return {
    id_monday: item.id ?? null,
    Nombre: item.nombre ?? null,
    Estado: item.estado ?? null,
    Categoria: item.categoria ?? null,
    Costo: item.costo ?? null,
    Fecha: item.fecha ?? null,
    URL: item.url ?? null,
  };
}

function getAlternatePath(path) {
  if (path.endsWith('/api/activo-digital')) {
    return '/api/activos-digitales';
  }
  if (path.endsWith('/api/activos-digitales')) {
    return '/api/activo-digital';
  }
  return null;
}

async function upsertActivosDigitalesToStrapi(items) {
  const { baseUrl, path, headers } = getStrapiConfig();
  const fallbackPath = getAlternatePath(path);

  if (!headers.Authorization) {
    throw new Error('Falta STRAPI_API_TOKEN para crear/actualizar en Strapi.');
  }

  const existingRows = await fetchAllStrapiEntries();
  const existingByMondayId = new Map();

  existingRows.forEach((row) => {
    const normalized = normalizeRow(row);
    if (normalized.id) {
      existingByMondayId.set(String(normalized.id), {
        entryId: normalized.__entryId,
        documentId: normalized.__documentId,
      });
    }
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item || !item.id) {
      continue;
    }

    const payload = { data: toStrapiPayload(item) };
    const existing = existingByMondayId.get(String(item.id));
    const entryId = existing?.entryId;
    const documentId = existing?.documentId;
    const method = entryId || documentId ? 'PUT' : 'POST';

    const tryRequest = async (writePath, overrideMethod, targetId) => {
      const endpoint = targetId
        ? `${baseUrl}${writePath}/${targetId}`
        : `${baseUrl}${writePath}`;
      const response = await fetch(endpoint, {
        method: overrideMethod || method,
        headers,
        body: JSON.stringify(payload),
      });
      return response;
    };

    let response = await tryRequest(path, undefined, entryId || documentId);

    if (response.status === 404 && fallbackPath) {
      response = await tryRequest(fallbackPath, undefined, entryId || documentId);
    }

    if (response.status === 405 && (entryId || documentId)) {
      // Algunos setups aceptan PATCH en lugar de PUT
      response = await tryRequest(path, 'PATCH', entryId || documentId);
      if (response.status === 404 && fallbackPath) {
        response = await tryRequest(fallbackPath, 'PATCH', entryId || documentId);
      }
    }

    if (response.status === 405 && documentId && entryId && documentId !== entryId) {
      // Intentar con documentId si el id numérico no funciona
      response = await tryRequest(path, 'PATCH', documentId);
      if (response.status === 404 && fallbackPath) {
        response = await tryRequest(fallbackPath, 'PATCH', documentId);
      }
    }

    if (!response.ok) {
      if (response.status === 405 && (entryId || documentId)) {
        skipped += 1;
        console.warn(
          `Aviso: Strapi no permite actualizar el registro ${item.id} (HTTP 405). Se omite la actualización.`
        );
        continue;
      }

      const text = await response.text().catch(() => '');
      throw new Error(
        `Error al sincronizar Strapi (HTTP ${response.status}). ` +
          `Verifica STRAPI_ACTIVO_DIGITAL_PATH. ${text}`
      );
    }

    if (entryId) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return { created, updated, skipped };
}

module.exports = { getActivosDigitalesFromStrapi, upsertActivosDigitalesToStrapi };
