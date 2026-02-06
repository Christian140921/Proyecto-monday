async function getMondayData() {
  const endpoint =
    process.env.MONDAY_DATA_URL || 'http://localhost:5678/webhook/monday-data';

  let response;
  try {
    response = await fetch(endpoint);
  } catch (error) {
    throw new Error(`No se pudo conectar con Monday (${endpoint}).`);
  }

  if (!response.ok) {
    throw new Error(
      `Error al obtener datos desde Monday (vía n8n). HTTP ${response.status}`
    );
  }

  const payload = await response.json();

  if (Array.isArray(payload)) {
    if (payload.length === 1 && Array.isArray(payload[0]?.monday)) {
      return payload[0].monday;
    }
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

