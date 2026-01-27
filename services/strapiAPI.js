async function getActivosDigitalesFromStrapi() {
  const endpoint = 'http://localhost:1337/api/activo-digital?pagination%5BpageSize%5D=100';
  const response = await fetch(endpoint);

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
