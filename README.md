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
