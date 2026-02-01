async function getMondayData() {
  const endpoint =
    process.env.MONDAY_DATA_URL || 'http://localhost:5678/webhook/monday-data';

  let response;
  try {
    response = await fetch(endpoint);
  } catch (error) {
    throw new Error(
      `No se pudo conectar con la fuente de datos de Monday (${endpoint}). ` +
        'Asegúrate de que n8n esté corriendo y que el workflow/webhook exista, ' +
        'o configura MONDAY_DATA_URL.'
    );
  }

  if (!response.ok) {
    throw new Error(
      `Error al obtener datos desde Monday (vía n8n). HTTP ${response.status}`
    );
  }

  const payload = await response.json();

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.monday)) {
    return payload.monday;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

module.exports = { getMondayData };

