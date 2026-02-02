# Monday ↔ Strapi

Sincroniza cambios de Monday a Strapi automáticamente. Usa n8n para traer los datos, compara con lo que hay en Strapi y actualiza/crea/borra según sea necesario. Genera un reporte local en TXT y JSON.

**Usa:** Node.js, Express, Strapi 5.34.0, n8n, Docker

## Quick start

```bash
git clone <repo>
cd Proyecto-monday
cp .env.example .env
```

Obtén el token en http://localhost:1337/admin (Settings → API Tokens → Create new). Luego:

```env
STRAPI_API_TOKEN=tu_token_aqui
STRAPI_SYNC=true
STRAPI_SYNC_DELETE=true
```

```bash
docker compose -f docker/docker-compose.yml up -d
```

Listo. Los 3 servicios (app, n8n, strapi) suben en ~40 segundos.

## Uso

```bash
node src/index.js          # Sincroniza manualmente
npm start                  # Levanta servidor en :3000
```

Endpoints para descargar reportes:
- `/download` - Combinado
- `/download-monday` - Solo Monday
- `/download-strapi` - Solo Strapi

## Carpetas

```
src/index.js              # Orquesta todo
src/services/             # mondayAPI.js (webhook), strapiAPI.js (CRUD)
src/utils/                # Genera JSON y TXT
docker/                   # Dockerfile, docker-compose.yml
data/                     # Reportes generados
```

## Qué hace

Monday → n8n webhook → Node → Compara con Strapi → Crea/actualiza/borra → Guarda reporte

## Troubleshooting

**"Can't reach n8n"** - ¿Está levantado? `docker ps`

**"Strapi 403"** - Token inválido o sin permisos

**"HTTP 405"** - La colección `activo-digital` no existe en Strapi

## Security

⚠️ No commitees `.env` con tokens reales.

Los IDs internos se guardan solo localmente.
