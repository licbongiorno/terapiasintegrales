# -*- coding: utf-8 -*-
"""Genera las páginas internas del sitio a partir de index.html y tools/content.py.

Uso:  python3 tools/build.py

- Reutiliza el encabezado, el pie, el botón de WhatsApp y los íconos de index.html
  (una sola fuente: si cambiás el menú o el pie en index.html, volvé a ejecutar este script).
- Crea: /<especialidad>-alta-gracia/index.html, /privacidad/index.html, /404.html,
  y actualiza sitemap.xml y la sección "Páginas" de llms.txt.
- Si cambian el dominio, modificá SITE_URL y BASE_PATH.
"""
import html
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from content import PAGES  # noqa: E402

SITE_URL = "https://licbongiorno.github.io/terapiasintegrales/"   # con barra final
BASE_PATH = "/terapiasintegrales/"                                  # ruta absoluta (para 404.html)
WA = "5493515318080"
TODAY = date.today().isoformat()
CLINIC_ID = SITE_URL + "#clinica"

index = (ROOT / "index.html").read_text(encoding="utf-8")


def between(text, start, end, include_end=True):
    i = text.index(start)
    j = text.index(end, i) + (len(end) if include_end else 0)
    return text[i:j]


HEADER = between(index, '  <header class="header" id="top">', '<div class="nav__backdrop" aria-hidden="true"></div>')
TAIL = between(index, "  <!-- ================= FOOTER", '<script src="assets/js/main.js" defer></script>')


def relink(fragment, prefix):
    """Ajusta los enlaces de <a href> para páginas en subcarpetas."""
    def fix_tag(m):
        tag = m.group(0)

        def fix_href(h):
            v = h.group(1)
            if v == "#top" or v.startswith(("http", "tel:", "mailto:", "data:")):
                return h.group(0)
            if v == "#inicio":
                return f'href="{prefix or "./"}"'
            if v.startswith("#"):
                return f'href="{prefix}{v}"'
            return f'href="{prefix}{v}"'
        return re.sub(r'href="([^"]*)"', fix_href, tag)
    out = re.sub(r"<a\b[^>]*>", fix_tag, fragment)
    out = out.replace('src="assets/', f'src="{prefix}assets/')
    return out


def esc(t):
    return html.escape(t, quote=True)


def wa_link(text):
    from urllib.parse import quote
    return f"https://wa.me/{WA}?text={quote(text)}"


def head(title, desc, canonical, prefix, jsonld=None, robots="index, follow, max-image-preview:large"):
    ld = ""
    if jsonld:
        ld = '\n  <script type="application/ld+json">\n' + json.dumps(jsonld, ensure_ascii=False, indent=2) + "\n  </script>"
    canon = f'\n  <link rel="canonical" href="{canonical}">' if canonical else ""
    og = ""
    if canonical:
        og = f"""
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_AR">
  <meta property="og:site_name" content="Terapias Integrales">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{SITE_URL}assets/img/og-image.png">
  <meta name="twitter:card" content="summary_large_image">"""
    return f"""<!doctype html>
<!-- Diseño y desarrollo web: Lic. Nicolás Bongiorno · WhatsApp +54 9 351 657-5261 · https://wa.me/5493516575261 -->
<!-- Página generada por tools/build.py: editá tools/content.py y volvé a ejecutar el script. -->
<html lang="es-AR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <meta name="robots" content="{robots}">{canon}
  <meta name="theme-color" content="#1B7A66">
  <meta name="geo.region" content="AR-X">
  <meta name="geo.placename" content="Alta Gracia, Córdoba">{og}
  <link rel="icon" href="{prefix}assets/img/logo.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="{prefix}assets/img/apple-touch-icon.png">
  <link rel="manifest" href="{prefix}site.webmanifest">
  <link rel="preload" href="{prefix}assets/fonts/plusjakartasans-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="{prefix}assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{prefix}assets/css/styles.css">{ld}
</head>

<body>
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <div class="scroll-progress" aria-hidden="true"></div>

"""


def page_shell(prefix, body):
    return f"""{relink(HEADER, prefix)}

  <main id="main">
{body}
  </main>

{relink(TAIL, prefix)}
</body>
</html>
"""


BLOBS = """      <div class="hero__bg" aria-hidden="true">
        <span class="blob blob--1"></span>
        <span class="blob blob--2"></span>
        <span class="blob blob--3"></span>
      </div>"""
DOTS = '<span class="ldots reveal" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>'
BY_SLUG = {p["slug"]: p for p in PAGES}


def build_page(p):
    prefix = "../"
    url = f"{SITE_URL}{p['slug']}/"
    is_program = p["therapy_type"] == "Service"
    kind = "Programa" if is_program else "Especialidad"
    wa_text = f"Hola Terapias Integrales, quisiera consultar por {p['name'].lower()}."
    li = lambda items: "\n".join(f"              <li>{esc(x)}</li>" for x in items)

    faq_html = "\n".join(
        f"""            <details class="acc reveal" name="faq"{' open' if i == 0 else ''}>
              <summary>{esc(q)}</summary>
              <div class="acc__body"><p>{esc(a)}</p></div>
            </details>""" for i, (q, a) in enumerate(p["faq"]))

    req = ""
    if p.get("requirements"):
        req = f"""
            <h2 class="reveal">Documentación habitual</h2>
            <ul class="checks-ink reveal">
{li(p['requirements'])}
            </ul>
            <p class="reveal">Cada caso es distinto: escribinos y te guiamos paso a paso.</p>"""

    related = "\n".join(
        f"""            <li><a href="../{r}/" style="--c:{BY_SLUG[r]['color']}"><span class="card__icon"><svg aria-hidden="true"><use href="#{BY_SLUG[r]['icon']}"/></svg></span>{esc(BY_SLUG[r]['name'])}</a></li>"""
        for r in p["related"])

    body = f"""    <section class="page-hero" style="--c:{p['color']}" aria-labelledby="page-title">
{BLOBS}
      <div class="container page-hero__grid">
        <div>
          <nav class="crumbs" aria-label="Ruta de navegación">
            <ol>
              <li><a href="../">Inicio</a></li>
              <li><a href="../#{'programas' if is_program else 'especialidades'}">{'Programas' if is_program else 'Especialidades'}</a></li>
              <li aria-current="page">{esc(p['name'])}</li>
            </ol>
          </nav>
          <p class="eyebrow reveal">{kind} · Alta Gracia</p>
          <h1 id="page-title" class="reveal">{esc(p['h1'])}</h1>
          {DOTS}
          <p class="hero__lead reveal">{esc(p['lead'])}</p>
          <div class="hero__actions reveal">
            <a class="btn btn--primary btn--lg magnetic" href="{esc(wa_link(wa_text))}" target="_blank" rel="noopener">
              <svg aria-hidden="true" width="20" height="20"><use href="#i-wa"/></svg>
              Consultar por WhatsApp
            </a>
            <a class="btn btn--ghost btn--lg" href="../#orientador-seccion">¿No sabés si es para vos?</a>
          </div>
        </div>
        <div class="page-hero__icon reveal" aria-hidden="true"><svg><use href="#{p['icon']}"/></svg></div>
      </div>
    </section>

    <section class="section">
      <div class="container page-layout">
        <article class="prose" style="--c:{p['color']}">
          <h2 class="reveal">{esc(p['name'])} con mirada interdisciplinaria</h2>
{chr(10).join(f'          <p class="reveal">{esc(t)}</p>' for t in p['what'])}

          <h2 class="reveal">¿Cuándo consultar?</h2>
          <ul class="checks-ink reveal">
{li(p['when'])}
          </ul>

          <h2 class="reveal">Cómo trabajamos</h2>
          <ul class="checks-ink reveal">
{li(p['how'])}
          </ul>{req}

          <h2 class="reveal">¿A quiénes atendemos?</h2>
          <p class="reveal">{esc(p['ages'])} Atendemos en Deán Funes 56, Barrio Pellegrini, Alta Gracia (Córdoba), de lunes a viernes de 08:00 a 20:00 hs.</p>

          <h2 class="reveal">Preguntas frecuentes sobre {esc(p['name'].lower())}</h2>
          <div class="accordion">
{faq_html}
          </div>
        </article>

        <aside class="page-aside">
          <div class="aside-card reveal">
            <h2>Pedí tu turno</h2>
            <ul>
              <li>📍 Deán Funes 56, Alta Gracia</li>
              <li>🕗 Lunes a viernes · 08 a 20 hs</li>
              <li>💳 Particular y obras sociales</li>
            </ul>
            <a class="btn btn--primary magnetic" href="{esc(wa_link(wa_text))}" target="_blank" rel="noopener">
              <svg aria-hidden="true" width="18" height="18"><use href="#i-wa"/></svg> Escribinos
            </a>
            <p style="margin:14px 0 0;text-align:center"><a href="tel:+5493515318080">o llamá al 0351 531-8080</a></p>
          </div>
        </aside>
      </div>
    </section>

    <section class="section section--soft" aria-labelledby="rel-title">
      <div class="container">
        <header class="section__head">
          <p class="eyebrow reveal">Trabajo en equipo</p>
          <h2 id="rel-title" class="reveal">Especialidades que suelen complementarse</h2>
          {DOTS}
        </header>
        <ul class="related reveal">
{related}
        </ul>
      </div>
    </section>"""

    jsonld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "MedicalWebPage",
                "@id": url + "#pagina",
                "url": url,
                "name": p["title"],
                "description": p["description"],
                "inLanguage": "es-AR",
                "isPartOf": {"@id": SITE_URL + "#web"},
                "about": {"@id": url + "#servicio"},
                "lastReviewed": TODAY,
                "breadcrumb": {"@id": url + "#ruta"},
            },
            {
                "@type": p["therapy_type"],
                "@id": url + "#servicio",
                "name": f"{p['name']} en Alta Gracia",
                "description": p["lead"],
                **({"provider": {"@id": CLINIC_ID}, "serviceType": p["name"], "areaServed": {"@type": "City", "name": "Alta Gracia"}}
                   if p["therapy_type"] == "Service" else {}),
            },
            {
                "@type": ["MedicalClinic", "LocalBusiness"],
                "@id": CLINIC_ID,
                "name": "Terapias Integrales",
                "url": SITE_URL,
                "telephone": "+54 9 351 531-8080",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Deán Funes 56, Barrio Pellegrini",
                    "addressLocality": "Alta Gracia",
                    "addressRegion": "Córdoba",
                    "postalCode": "X5186GHG",
                    "addressCountry": "AR",
                },
                "availableService": {"@id": url + "#servicio"},
            },
            {
                "@type": "BreadcrumbList",
                "@id": url + "#ruta",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITE_URL},
                    {"@type": "ListItem", "position": 2, "name": "Programas" if is_program else "Especialidades",
                     "item": SITE_URL + ("#programas" if is_program else "#especialidades")},
                    {"@type": "ListItem", "position": 3, "name": p["name"], "item": url},
                ],
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
                    for q, a in p["faq"]
                ],
            },
        ],
    }
    out = head(p["title"], p["description"], url, prefix, jsonld) + page_shell(prefix, body)
    dest = ROOT / p["slug"] / "index.html"
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(out, encoding="utf-8")
    return url


def build_privacy():
    prefix = "../"
    url = SITE_URL + "privacidad/"
    body = f"""    <section class="page-hero" style="--c:var(--green)" aria-labelledby="page-title">
{BLOBS}
      <div class="container">
        <nav class="crumbs" aria-label="Ruta de navegación"><ol><li><a href="../">Inicio</a></li><li aria-current="page">Privacidad</li></ol></nav>
        <h1 id="page-title" class="reveal">Política de privacidad</h1>
        {DOTS}
        <p class="hero__lead reveal">Cómo tratamos los datos que nos compartís a través de este sitio.</p>
      </div>
    </section>
    <section class="section">
      <div class="container prose">
        <h2>Responsable</h2>
        <p>Terapias Integrales, Deán Funes 56, Barrio Pellegrini (X5186GHG), Alta Gracia, Córdoba, Argentina. Contacto: WhatsApp <a href="https://wa.me/{WA}">+54 9 351 531-8080</a>.</p>
        <h2>Qué datos recibimos</h2>
        <p>Este sitio no guarda datos en ningún servidor. Los formularios (contacto, orientador y postulaciones) solo arman un mensaje que se abre en tu WhatsApp; vos decidís si enviarlo. Si lo enviás, recibimos los datos que incluyas: nombre, especialidad de interés, obra social, mensaje y, en postulaciones, profesión, matrícula y CV.</p>
        <h2>Para qué los usamos</h2>
        <p>Únicamente para responder tu consulta, coordinar turnos o evaluar tu postulación. No vendemos ni cedemos tus datos a terceros.</p>
        <h2>Datos de salud</h2>
        <p>Te pedimos que no compartas por este medio información clínica detallada. Los datos de salud se tratan con confidencialidad y secreto profesional, conforme a la Ley 25.326 de Protección de Datos Personales y la Ley 26.529 de Derechos del Paciente.</p>
        <h2>Servicios de terceros</h2>
        <p>Al abrir WhatsApp o el mapa interactivo de Google Maps, se aplican las políticas de privacidad de esos servicios. El mapa solo se carga si lo tocás.</p>
        <h2>Tus derechos</h2>
        <p>Podés solicitar el acceso, la rectificación o la supresión de tus datos escribiéndonos por WhatsApp. La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende las denuncias y reclamos relacionados con el incumplimiento de las normas de protección de datos personales.</p>
        <p><small>Última actualización: {TODAY}.</small></p>
      </div>
    </section>"""
    out = head("Política de privacidad · Terapias Integrales", "Cómo tratamos los datos que nos compartís en el sitio de Terapias Integrales, Alta Gracia.", url, prefix) + page_shell(prefix, body)
    (ROOT / "privacidad").mkdir(exist_ok=True)
    (ROOT / "privacidad" / "index.html").write_text(out, encoding="utf-8")
    return url


def build_404():
    prefix = BASE_PATH
    links = "\n".join(f'            <li><a href="{prefix}{p["slug"]}/" style="--c:{p["color"]}"><span class="card__icon"><svg aria-hidden="true"><use href="#{p["icon"]}"/></svg></span>{esc(p["name"])}</a></li>' for p in PAGES[:6])
    logo = re.search(r'<svg class="lm" viewBox.*?</svg>', index, re.S).group(0)
    body = f"""    <section class="notfound">
      <div class="container">
        {logo.replace('class="lm"', 'class="lm is-built"')}
        <p class="eyebrow">Error 404</p>
        <h1>Esta página se nos perdió</h1>
        <p class="hero__lead" style="margin-inline:auto">Pero el equipo sigue acá. Volvé al inicio o elegí una especialidad.</p>
        <div class="hero__actions" style="justify-content:center">
          <a class="btn btn--primary btn--lg" href="{prefix}">Ir al inicio</a>
          <a class="btn btn--ghost btn--lg" href="{esc(wa_link('Hola Terapias Integrales, quisiera hacer una consulta.'))}" target="_blank" rel="noopener">Escribinos por WhatsApp</a>
        </div>
        <ul class="related" style="text-align:left;margin-top:24px">
{links}
        </ul>
      </div>
    </section>"""
    out = head("Página no encontrada · Terapias Integrales", "La página que buscás no existe.", None, prefix, robots="noindex") + page_shell(prefix, body)
    (ROOT / "404.html").write_text(out, encoding="utf-8")


def build_sitemap(urls):
    rows = [(SITE_URL, "1.0", "monthly")] + [(u, "0.8", "monthly") for u in urls if "privacidad" not in u] + [(SITE_URL + "privacidad/", "0.2", "yearly")]
    body = "\n".join(f"""  <url>
    <loc>{u}</loc>
    <lastmod>{TODAY}</lastmod>
    <changefreq>{f}</changefreq>
    <priority>{pr}</priority>
  </url>""" for u, pr, f in rows)
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}\n</urlset>\n', encoding="utf-8")


def build_llms():
    path = ROOT / "llms.txt"
    text = path.read_text(encoding="utf-8")
    text = text.split("## Páginas")[0].rstrip() + "\n\n## Páginas\n"
    text += f"- [Inicio]({SITE_URL}): especialidades, orientador para elegir especialidad, programas, preguntas frecuentes, trabajá con nosotros, ubicación y contacto.\n"
    for p in PAGES:
        text += f"- [{p['name']} en Alta Gracia]({SITE_URL}{p['slug']}/): {p['description']}\n"
    text += f"- [Política de privacidad]({SITE_URL}privacidad/)\n"
    path.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    urls = [build_page(p) for p in PAGES]
    urls.append(build_privacy())
    build_404()
    build_sitemap(urls)
    build_llms()
    print(f"OK · {len(PAGES)} páginas + privacidad + 404 + sitemap + llms.txt")
