async function getActivosDigitalesFromStrapi() {
  const baseUrl = (process.env.STRAPI_BASE_URL || 'http://localhost:1337').replace(/\/$/, '');
  const endpoint = `${baseUrl}/api/activo-digital?pagination%5BpageSize%5D=100`;

  let response;
  try {
    response = await fetch(endpoint);
  } catch (error) {
    throw new Error(
      `No se pudo conectar con Strapi en ${baseUrl}. ` +
        'Asegúrate de que Strapi esté corriendo y accesible (por defecto http://localhost:1337), ' +
        'o configura STRAPI_BASE_URL.'
    );
  }

  if (!response.ok) {
    throw new Error(`Error al obtener datos desde Strapi (HTTP ${response.status})`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return rows.map((row) => ({
    id: row.id_monday ? String(row.id_monday) : row.id ? String(row.id) : undefined,
    nombre: row.nombre ?? null,
    estado: row.estado ?? null,
    categoria: row.categoria ?? null,
    costo: row.costo ?? null,
    fecha: row.fecha ?? null,
    url: row.url ?? null,
  }));
}

module.exports = { getActivosDigitalesFromStrapi };
