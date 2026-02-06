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
STRAPI_API_TOKEN=ef073a8cf8f18ae38cf734ed3332d226ed5424351075ed65f96ed3d6618596c149aa01b74f42fcaf39e7cf585dce84726dd47e9cfcff9a44c87e59f9b49789b8dcdeeec348e165002115df6c12c6be155aa0aba6180b7cbe3ec6af95be753ddda7e5b914027ce08231a811c2c292330332f250c80d2ff9852d94ecbd3c68200d
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
