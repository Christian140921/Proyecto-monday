async function getMondayData() {
  const response = await fetch('http://localhost:5678/webhook/monday-data');

  if (!response.ok) {
    throw new Error('Error al obtener datos de n8n');
  }

  const data = await response.json();
  return data;
}

module.exports = {
  getMondayData
};

