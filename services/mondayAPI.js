async function getMondayData() {
  const response = await fetch('http://localhost:5678/webhook/monday-data');

  if (!response.ok) {
    throw new Error('Error al obtener datos desde n8n');
  }

  return await response.json();
}

module.exports = { getMondayData };

