async function getActivosDigitalesFromStrapi() {
  const baseUrl = (process.env.STRAPI_BASE_URL || 'http://localhost:1337').replace(/\/$/, '');
  const path = (process.env.STRAPI_ACTIVO_DIGITAL_PATH || '/api/activo-digital').replace(/^([^/])/, '/$1');
  const endpoint = `${baseUrl}${path}?pagination%5BpageSize%5D=100`;

  const headers = {
    Accept: 'application/json',
  };
  const token = process.env.STRAPI_API_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

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
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return rows.map((row) => {
    const source = row && typeof row === 'object' ? row.attributes || row : {};

    const idFromMonday = source.id_monday ?? source.idMonday;
    const idFallback = row && row.id != null ? row.id : source.id;

    return {
      id: idFromMonday != null ? String(idFromMonday) : idFallback != null ? String(idFallback) : undefined,
      nombre: source.nombre ?? null,
      estado: source.estado ?? null,
      categoria: source.categoria ?? null,
      costo: source.costo ?? null,
      fecha: source.fecha ?? null,
      url: source.url ?? null,
    };
  });
}

module.exports = { getActivosDigitalesFromStrapi };
