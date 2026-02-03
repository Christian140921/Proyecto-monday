FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/

# Crear directorio de datos si no existe
RUN mkdir -p data/

EXPOSE 3000

CMD ["node", "src/server.js"]
