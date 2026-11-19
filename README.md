# Terapias Integrales · Alta Gracia

Sitio web estático (HTML + CSS + JS, sin dependencias) del centro de salud interdisciplinario Terapias Integrales.

## Estructura
- `index.html`: página única con SEO local y datos estructurados JSON-LD (MedicalClinic, FAQPage, WebSite)
- `assets/css/styles.css`: estilos mobile-first
- `assets/js/main.js`: animaciones, menú con gesto de deslizar, formulario que envía a WhatsApp
- `robots.txt`, `sitemap.xml`, `llms.txt` (para motores de IA), `site.webmanifest`

## Publicar
Activar GitHub Pages (Settings → Pages → rama `main`, carpeta `/`).
Si se usa un dominio propio, reemplazar `https://licbongiorno.github.io/terapiasintegrales` en `index.html`, `robots.txt`, `sitemap.xml` y `llms.txt`.

## Páginas internas (especialidades, privacidad, 404)
Se generan con un script a partir de `index.html` (encabezado y pie) y `tools/content.py` (textos):

```bash
python3 tools/build.py
```

Ejecutalo cada vez que cambies el menú o el pie en `index.html`, o los textos de `tools/content.py`. También actualiza `sitemap.xml` y `llms.txt`.

## Analítica (opcional)
`assets/js/main.js` ya envía eventos (clics en WhatsApp, teléfono, orientador, mapa, compartir) si se instala Google Analytics 4 (`gtag`) o Plausible.
