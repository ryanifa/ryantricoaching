"""Genereert de HTML-pagina's uit data/site.json en de sjablonen hieronder.
Draaien: python3 tools/build.py (na elke wijziging in VERSION of data/site.json).
De pagina's bevatten zo de standaardinhoud al, zodat de site ook zonder
JavaScript werkt; site.js vervangt die zodra de Gist binnen is."""
import json
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'data' / 'site.json').read_text(encoding='utf-8'))
VERSION = (ROOT / 'VERSION').read_text().strip()
import re as _re
_cfg = (ROOT / 'assets' / 'js' / 'config.js').read_text(encoding='utf-8')
FORMSPREE = (_re.search(r"formspreeId:\s*'([^']*)'", _cfg) or [None, 'FORMSPREE_ID'])[1]
SITE = 'https://ryantricoaching.nl'
NAME = DATA['info']['name']
FONTS = 'https://fonts.googleapis.com/css2?family=Sora:wght@700&family=Inter:wght@400;500;600&display=swap'

e = html.escape

WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.2-.7.1l-.9 1.1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.4-3c-.2-.4.3-.4.8-1.4.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6z"/></svg>'
CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
WAVE_SVG = '<svg viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="M0 40c120 25 240 25 360 0s240-25 360 0 240 25 360 0 240-25 360 0v30H0z"/></svg>'

ICONS = {
    'zwem': ['M3 17c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0', 'M3 12c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0', 'M14 7.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0'],
    'fiets': ['M5.5 17.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M18.5 17.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M5.5 14 9 7h6l3.5 7', 'M9 7 12 14h6.5', 'M14 4h2'],
    'loop': ['M13 4.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0', 'M7 21l3-6 3 2 1-4-3-2 2-4 3 3 3-1', 'M10 11 7 10l-3 3'],
}


def icon(kind):
    paths = ''.join(f'<path d="{d}"/>' for d in ICONS.get(kind, ICONS['loop']))
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{paths}</svg>'


NAV = [('diensten', 'Diensten'), ('zwemanalyse', 'Zwemanalyse'), ('race', 'Race'), ('werkwijze', 'Werkwijze'), ('over', 'Over Ryan'), ('ervaringen', 'Ervaringen')]


def head(page, title, desc, canonical, noindex=False, faq=None):
    """De <head> van een pagina. title ≤ 60 en desc ≤ 155 tekens waar het kan (check_lengths()).
    De gestructureerde gegevens komen uit schema_graph() (zelfde opbouw als assets/js/schema.js)."""
    url = f'{SITE}/{canonical}'
    jsonld = schema_graph(page, title, desc, url, faq)
    return f'''<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{e(title)}</title>
  <meta name="description" content="{e(desc)}">
  <meta name="theme-color" content="#F6FAF7">
  <meta name="version" content="{VERSION}">
  {'<meta name="robots" content="noindex, nofollow">' if noindex else ''}
  <link rel="canonical" href="{SITE}/{canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="nl_NL">
  <meta property="og:site_name" content="{e(NAME)}">
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(desc)}">
  <meta property="og:url" content="{SITE}/{canonical}">
  <meta property="og:image" content="{SITE}/assets/og.png">
  <meta property="og:image:alt" content="{e(NAME)}: triathlon-coaching in Rotterdam">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{e(title)}">
  <meta name="twitter:description" content="{e(desc)}">
  <link rel="icon" href="assets/logo/icon.svg" type="image/svg+xml">
  <link rel="icon" href="assets/logo/icon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="assets/logo/icon-180.png">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="{FONTS}" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="{FONTS}" rel="stylesheet"></noscript>
  <link rel="stylesheet" href="assets/css/base.css?v={VERSION}">
  <link rel="stylesheet" href="assets/css/site.css?v={VERSION}">
  <script type="application/ld+json" id="schema">{json.dumps(jsonld, ensure_ascii=False)}</script>
  <script type="module" src="assets/js/site.js?v={VERSION}"></script>
</head>
<body class="has-sticky" data-page="{page}">
  <a class="skip" href="#inhoud">Naar de inhoud</a>
  <div id="demo-banner" class="demo-banner" hidden>Voorbeeldweergave: je ziet nog niet gepubliceerde demo-gegevens uit deze browser.</div>
  <div id="announcement" class="announcement" hidden></div>

  <header class="topbar" id="top">
    <div class="wrap topbar-inner">
      <a class="brand" href="./" aria-label="{e(NAME)} – home">
        <img src="assets/logo/logo.svg" alt="{e(NAME)}" width="206" height="44">
      </a>
      <nav class="nav" aria-label="Hoofdmenu">
        {''.join(f'<a href="{p}.html">{l}</a>' for p, l in NAV)}
      </nav>
      <a class="btn btn-primary btn-sm cta-top" href="contact.html">Contact</a>
      <details class="menu">
        <summary aria-label="Menu openen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></summary>
        <nav class="menu-panel" aria-label="Menu">
          {''.join(f'<a href="{p}.html">{l}</a>' for p, l in NAV)}
          <a class="cta" href="contact.html">Contact</a>
        </nav>
      </details>
    </div>
  </header>

  <main id="inhoud">
'''


def footer():
    info = DATA['info']
    return f'''  </main>

  <footer class="footer" id="contact-footer">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <img src="assets/logo/logo.svg" alt="{e(NAME)}" width="206" height="44" loading="lazy">
          <p class="tagline" id="footer-tagline">{e(info['tagline'])}</p>
          <p>Ryan Douglas, triathlon-coach uit Rotterdam. Persoonlijke begeleiding voor beginners en gevorderden: zwemanalyse, trainingsschema's en coaching naar je race.</p>
        </div>
        <div>
          <h3>Contact</h3>
          <ul>
            <li><a class="wa-link" href="contact.html#formulier">WhatsApp</a></li>
            <li><a href="contact.html">Contactformulier</a></li>
            <li id="contact-mail" hidden><span data-k="email"></span></li>
          </ul>
        </div>
        <div>
          <h3>Pagina's</h3>
          <ul>
            {''.join(f'<li><a href="{p}.html">{l}</a></li>' for p, l in NAV)}
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        <div>
          <h3 class="social-head" hidden>Volg Ryan</h3>
          <ul class="social-links" hidden></ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span id="jaar">2026</span> {e(NAME)} · Rotterdam<span id="footer-kvk" hidden> · KvK <span data-k="kvk"></span></span></span>
        <span><a href="privacy.html">Privacy</a> · <a href="voorwaarden.html">Voorwaarden</a> · <a href="beheer.html" rel="nofollow">Beheer</a> · <span class="versie" id="versie" title="Versie van de website">v{VERSION}</span></span>
      </div>
    </div>
  </footer>

  <div class="sticky-cta" id="sticky-cta">
    <a class="btn btn-primary" href="contact.html">Plan een kennismaking</a>
    <a class="btn btn-wa wa-link" href="contact.html#formulier" aria-label="WhatsApp">{WA_SVG}</a>
  </div>
</body>
</html>
'''


def cta_band(kop='Zullen we even bellen?', tekst='Een kennismaking is gratis en duurt een half uur. Bellen of koffie in Rotterdam, jij zegt het maar.'):
    return f'''    <section class="section cta-band" aria-labelledby="cta-title">
      <div class="wrap">
        <h2 id="cta-title">{e(kop)}</h2>
        <p>{e(tekst)}</p>
        <div class="hero-cta">
          <a class="btn btn-primary btn-lg wa-link" href="contact.html#formulier" data-cta="primair">{e(DATA['hero']['ctaPrimair'])}</a>
          <a class="btn btn-ghost btn-lg" href="contact.html">Stuur een bericht</a>
        </div>
      </div>
    </section>
'''


def faq_voor(pagina):
    """FAQ-vragen voor één pagina; zelfde regel als faqVoor() in store.js."""
    return [f for f in DATA['faq'] if f.get('vraag', '').strip() and f.get('antwoord', '').strip() and f.get('pagina', 'algemeen') == pagina]


def faq_section(kop='Veelgestelde vragen', pagina='algemeen', alt=False, intro=''):
    """Inklapbare vragen (<details>, leesbaar zonder JS). site.js vervangt ze door de live lijst van dezelfde pagina."""
    faq = faq_voor(pagina)
    items = ''.join(f'<details class="faq"><summary>{e(f["vraag"])}</summary><p>{e(f["antwoord"])}</p></details>' for f in faq)
    return f'''    <section class="section{' section-alt' if alt else ''}" aria-labelledby="faq-title"{'' if faq else ' hidden'}>
      <div class="wrap">
        <div class="section-head"><h2 id="faq-title">{e(kop)}</h2>{f'<p>{e(intro)}</p>' if intro else ''}</div>
        <div class="faq-list" id="faq" data-faq="{pagina}">{items}</div>
      </div>
    </section>
'''


def links_rij(links):
    """Rij interne links in de body (naast de navigatie), bv. terug naar diensten en contact."""
    return '<p class="links-rij">' + ''.join(f'<a href="{e(h)}">{e(t)}</a>' for h, t in links) + '</p>'


def page_head(kicker, h1, lede):
    return f'''    <div class="wrap page-head">
      <div class="kicker">{e(kicker)}</div>
      <h1>{e(h1)}</h1>
      <p>{e(lede)}</p>
    </div>
'''


# ------------------------------------------------- gestructureerde gegevens
# Zelfde opbouw als buildSchema() in assets/js/schema.js; site.js vervangt dit blok
# zodra de live gegevens (telefoon, e-mail, sameAs, prijzen, FAQ) binnen zijn.
ID_RYAN, ID_BUSINESS, ID_WEBSITE = f'{SITE}/#ryan', f'{SITE}/#business', f'{SITE}/#website'
AREA = ['Rotterdam', 'Zuid-Holland', 'Nederland (online)']
ADDRESS = {'@type': 'PostalAddress', 'addressLocality': 'Rotterdam', 'addressRegion': 'Zuid-Holland', 'addressCountry': 'NL'}
PAGE_NAMES = {
    'diensten': 'Diensten', 'zwemanalyse': 'Zwemanalyse', 'race': 'Begeleiding naar je race', 'werkwijze': 'Werkwijze',
    'over': 'Over Ryan', 'ervaringen': 'Ervaringen', 'contact': 'Contact', 'privacy': 'Privacy', 'voorwaarden': 'Voorwaarden', 'bedankt': 'Bedankt',
}
ONDER_DIENSTEN = ['zwemanalyse', 'race']
FAQ_PAGES = ['home', 'diensten', 'zwemanalyse']
SERVICE_TYPES = {'zwemanalyse': 'Zwemanalyse met onderwatervideo', 'schemas': 'Trainingsschema fietsen en lopen', 'race': 'Triathlon-coaching: begeleiding naar je race'}


def is_url(u):
    return bool(_re.match(r'^https?://', u or '', _re.I))


def is_real_phone(p):
    digits = _re.sub(r'\D', '', p or '')
    return len(digits) >= 9 and 'x' not in (p or '').lower()


def is_real_email(m):
    return bool(_re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', m or '')) and not (m or '').lower().endswith('voorbeeld.nl')


def tel_international(phone):
    d = _re.sub(r'\D', '', phone or '')
    if d.startswith('00'):
        d = d[2:]
    elif d.startswith('0'):
        d = '31' + d[1:]
    return '+' + d


def social_links(info):
    """Zelfde regels als socialLinks() in store.js: gebruikersnaam → volledige link."""
    from urllib.parse import quote
    out = []
    if info.get('instagram'):
        v = info['instagram']
        out.append(v if is_url(v) else f"https://www.instagram.com/{quote(v.lstrip('@'), safe='')}/")
    if info.get('strava'):
        v = info['strava']
        out.append(v if is_url(v) else f"https://www.strava.com/athletes/{quote(v, safe='')}")
    if info.get('facebook'):
        v = info['facebook']
        out.append(v if is_url(v) else f"https://www.facebook.com/{quote(v, safe='')}")
    if info.get('linkedin'):
        v = info['linkedin']
        out.append(v if is_url(v) else f"https://www.linkedin.com/in/{quote(_re.sub(r'^/?in/', '', v), safe='')}/")
    return out


def dienst_url(d):
    return f"{SITE}/{'zwemanalyse.html' if d['id'] == 'zwemanalyse' else 'race.html' if d['id'] == 'race' else 'diensten.html#' + d['id']}"


def prijs_van(d):
    """Prijs in euro als getal (> 0), anders None; dan geen Offer."""
    try:
        n = float(str(d.get('prijs') or '').replace(',', '.'))
    except ValueError:
        return None
    if n <= 0:
        return None
    return int(n) if n.is_integer() else n


def price_range(diensten):
    prijzen = [p for p in (prijs_van(d) for d in diensten) if p]
    if not prijzen:
        return 'Op aanvraag'
    lo, hi = min(prijzen), max(prijzen)
    return f'€{lo}' if lo == hi else f'€{lo}–€{hi}'


def schema_graph(page, title, desc, url, faq=None):
    """Het @graph voor één pagina: Person, SportsActivityLocation, WebSite, Service per dienst
    (met Offer als er een prijs is), WebPage, BreadcrumbList (subpagina's) en FAQPage (eigen FAQ)."""
    info = DATA['info']
    same_as = [u for u in social_links(info) + [info.get('tvs90', ''), info.get('cs010', '')] if is_url(u)]
    diensten = [d for d in DATA['diensten'] if d.get('titel') and not d.get('hidden')]
    phone = info.get('phone') or info.get('whatsapp')

    person = {
        '@type': 'Person', '@id': ID_RYAN, 'name': 'Ryan Douglas', 'jobTitle': 'Triathlon-coach',
        'url': f'{SITE}/over.html', 'image': f'{SITE}/assets/img/ryan.jpg',
        'address': {'@type': 'PostalAddress', 'addressLocality': 'Rotterdam', 'addressCountry': 'NL'},
        'worksFor': {'@id': ID_BUSINESS},
        'memberOf': [
            {'@type': 'SportsTeam', 'name': "TVS'90", 'sport': 'Triathlon', **({'url': info['tvs90']} if is_url(info.get('tvs90')) else {})},
            {'@type': 'SportsTeam', 'name': 'CS010', 'sport': 'Wielrennen', **({'url': info['cs010']} if is_url(info.get('cs010')) else {})},
        ],
        **({'sameAs': same_as} if same_as else {}),
    }
    business = {
        '@type': 'SportsActivityLocation', '@id': ID_BUSINESS, 'name': NAME, 'url': f'{SITE}/',
        'image': f'{SITE}/assets/og.png', 'logo': f'{SITE}/assets/logo/icon-512.png',
        'description': DATA['hero']['sub'],
        **({'telephone': tel_international(phone)} if is_real_phone(phone) else {}),
        **({'email': info['email']} if is_real_email(info.get('email')) else {}),
        'address': ADDRESS, 'areaServed': AREA, 'priceRange': price_range(diensten),
        'founder': {'@id': ID_RYAN}, 'employee': {'@id': ID_RYAN},
        **({'sameAs': same_as} if same_as else {}),
    }
    website = {'@type': 'WebSite', '@id': ID_WEBSITE, 'name': NAME, 'url': f'{SITE}/', 'inLanguage': 'nl-NL', 'publisher': {'@id': ID_BUSINESS}}
    services = []
    for d in diensten:
        svc = {
            '@type': 'Service', '@id': f"{SITE}/#service-{d['id']}", 'name': d['titel'], 'serviceType': SERVICE_TYPES.get(d['id'], d['titel']),
            'description': d.get('kort', ''), 'provider': {'@id': ID_BUSINESS}, 'areaServed': AREA, 'url': dienst_url(d),
        }
        prijs = prijs_van(d)
        if prijs:
            svc['offers'] = {'@type': 'Offer', 'price': prijs, 'priceCurrency': 'EUR', 'url': dienst_url(d), 'availability': 'https://schema.org/InStock'}
        services.append(svc)
    webpage = {
        '@type': 'WebPage', '@id': f'{url}#webpage', 'url': url, 'name': title, 'description': desc, 'inLanguage': 'nl-NL',
        'isPartOf': {'@id': ID_WEBSITE}, 'about': {'@id': ID_BUSINESS}, 'primaryImageOfPage': f'{SITE}/assets/og.png',
    }
    graph = [person, business, website, *services, webpage]
    if page != 'home' and page in PAGE_NAMES:
        items = [('Home', f'{SITE}/')]
        if page in ONDER_DIENSTEN:
            items.append((PAGE_NAMES['diensten'], f'{SITE}/diensten.html'))
        items.append((PAGE_NAMES[page], url))
        graph.append({'@type': 'BreadcrumbList', '@id': f'{url}#breadcrumb',
                      'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(items)]})
    if faq:
        graph.append({'@type': 'FAQPage', '@id': f'{url}#faq',
                      'mainEntity': [{'@type': 'Question', 'name': f['vraag'], 'acceptedAnswer': {'@type': 'Answer', 'text': f['antwoord']}} for f in faq]})
    return {'@context': 'https://schema.org', '@graph': graph}


# --------------------------------------------------------------------- index
def build_index():
    h = DATA['hero']
    start = ''
    for i, s in enumerate(DATA['startpunten']):
        start += f'''<a class="start-card" href="{e(s['link'])}"><div class="icon">{icon(['loop', 'fiets', 'zwem'][i % 3])}</div><h3>{e(s['titel'])}</h3><p>{e(s['tekst'])}</p><span class="more">{e(s['knop'])}</span></a>'''
    diensten = ''
    for d in DATA['diensten']:
        link = 'zwemanalyse.html' if d['id'] == 'zwemanalyse' else 'race.html' if d['id'] == 'race' else f"diensten.html#{d['id']}"
        diensten += f'''<div class="dienst"><div class="icon">{icon(d['icon'])}</div><div><h3>{e(d['titel'])}</h3><p>{e(d['kort'])}</p><a href="{link}">Meer over {e(d['titel'].lower())}</a></div></div>'''
    usps = ''.join(f'<div class="usp"><div class="num" aria-hidden="true">{i+1}</div><h3>{e(u["titel"])}</h3><p>{e(u["tekst"])}</p></div>' for i, u in enumerate(DATA['usps']))
    results = ''.join(f'<div class="result"><span class="val">{e(r["waarde"])}</span><span class="lbl">{e(r["label"])}</span>{maand(r["datum"])}</div>' for r in DATA['resultaten'])
    steps = ''.join(f'<li class="step"><div class="n" aria-hidden="true">{s["stap"]}</div><h3>{e(s["titel"])}</h3><p>{e(s["tekst"])}</p></li>' for s in DATA['werkwijze'][:4])
    plaatsen = [x.strip() for x in _re.split(r'[,;\n]', DATA['info'].get('plaatsen', '')) if x.strip()]
    body = f'''    <section class="hero" aria-labelledby="hero-title">
      <div class="wrap hero-grid">
        <div class="hero-inner">
          <h1 id="hero-title">{e(h['kop'])}</h1>
          <p class="lede" id="hero-sub">{e(h['sub'])}</p>
          <div class="hero-cta">
            <a class="btn btn-primary btn-lg wa-link" href="contact.html#formulier" data-cta="primair">{e(h['ctaPrimair'])}</a>
            <a class="btn btn-ghost btn-lg" href="diensten.html" id="hero-cta-2">{e(h['ctaSecundair'])}</a>
          </div>
          <p class="hero-note">{CHECK_SVG}<span>Kennismaking is gratis. Ik werk met hooguit een handvol atleten tegelijk.</span></p>
        </div>
        <figure class="hero-photo">
          <img src="assets/img/ryan.jpg" alt="Ryan Douglas, triathlon-coach uit Rotterdam, bij de finish van een hele triathlon" width="840" height="1050" data-optional fetchpriority="high" decoding="async" onerror="this.closest('.hero-photo').classList.add('no-img')">
          <div class="ring" aria-hidden="true"></div>
          <div class="mark-art" aria-hidden="true"><img src="assets/logo/logo-mark.svg" alt="" width="64" height="64"></div>
          <figcaption>Ryan Douglas, Rotterdam</figcaption>
        </figure>
      </div>
      <div class="hero-waves wave">{WAVE_SVG}</div>
    </section>

    <section class="section section-alt" aria-labelledby="start-title" style="padding-top:24px">
      <div class="wrap">
        <div class="section-head">
          <h2 id="start-title">Waar sta je?</h2>
          <p>Kies wat het meest op jou lijkt. Dan weet je meteen waar je moet beginnen.</p>
        </div>
        <div class="grid grid-3" id="startpunten">{start}</div>
      </div>
    </section>

    <section class="section" aria-labelledby="diensten-title">
      <div class="wrap">
        <div class="section-head">
          <h2 id="diensten-title">Wat ik voor je kan doen</h2>
          <p>Drie diensten, los of in combinatie. Prijzen op aanvraag; we kijken samen wat past.</p>
        </div>
        <div class="grid grid-3" id="diensten">{diensten}</div>
        <p style="margin-top:24px"><a href="diensten.html">Alle diensten uitgebreid</a></p>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="usp-title">
      <div class="wrap">
        <div class="section-head">
          <h2 id="usp-title">Waarom met mij?</h2>
        </div>
        <div class="grid grid-3" id="usps">{usps}</div>
      </div>
    </section>

    <section class="section" aria-labelledby="story-title">
      <div class="wrap story">
        <figure class="photo" style="margin:0">
          <img src="assets/img/ryan-loop.jpg" alt="Ryan Douglas, triathlon-coach uit Rotterdam, tijdens een hardlooptraining langs het water" width="720" height="720" loading="lazy" decoding="async" data-optional onerror="this.closest('.story').classList.add('no-img')">
        </figure>
        <div>
          <h2 id="story-title">{e(DATA['overKop'])}</h2>
          <p class="lead" id="verhaal-teaser">{e(DATA['verhaal'][0]['tekst'])}</p>
          <a class="btn btn-ghost" href="over.html">Lees mijn verhaal</a>
        </div>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="res-title">
      <div class="wrap">
        <div class="section-head">
          <h2 id="res-title">Wat ik zelf heb gelopen, gefietst en gezwommen</h2>
          <p>Geen beloftes, gewoon de cijfers uit mijn eigen horloge.</p>
        </div>
        <div class="results" id="resultaten">{results}</div>
        <p class="results-note" id="resultaten-noot">{e(DATA['resultatenNoot'])}</p>
        <p style="margin-top:12px"><a href="over.html#wedstrijden">Alle wedstrijden en tijden sinds 2016</a></p>
      </div>
    </section>

    <section class="section" aria-labelledby="steps-title">
      <div class="wrap">
        <div class="section-head">
          <h2 id="steps-title">Zo werkt het</h2>
          <p>Van een eerste gesprek tot de finish, in vier stappen.</p>
        </div>
        <ol class="steps" id="steps">{steps}</ol>
        <p style="margin-top:28px"><a href="werkwijze.html">De hele werkwijze, en wat ik van jou verwacht</a></p>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="rev-title">
      <div class="wrap">
        <div class="section-head">
          <h2 id="rev-title">Ervaringen</h2>
        </div>
        <div class="grid grid-3" id="reviews" hidden></div>
        <div class="card empty" id="reviews-leeg"><p>De eerste ervaringen van atleten verschijnen hier binnenkort. Wil je weten hoe ik werk? Vraag het me gewoon.</p><a class="btn btn-ghost btn-sm" href="contact.html">Neem contact op</a></div>
      </div>
    </section>

    <section class="section" aria-labelledby="plaatsen-title"{'' if plaatsen else ' hidden'}>
      <div class="wrap">
        <div class="section-head">
          <h2 id="plaatsen-title">Voor wie uit Rotterdam en omgeving</h2>
          <p>Ik coach vanuit Rotterdam. Voor de kennismaking en de <a href="zwemanalyse.html">zwemanalyse</a> spreken we af in de stad of bij jou in de buurt; de wekelijkse begeleiding gaat via WhatsApp en Strava of Garmin. Zo werk ik met atleten uit:</p>
        </div>
        <ul class="plaatsen" id="plaatsen">{''.join(f'<li>{e(x)}</li>' for x in plaatsen)}</ul>
        <p class="results-note">Woon je verder weg? <a href="diensten.html#schemas">Trainingsschema's</a> en <a href="race.html">begeleiding naar je race</a> werken ook helemaal online.</p>
      </div>
    </section>

{faq_section('Vragen van beginners', 'home', alt=True, intro='Eerste triathlon in Rotterdam? Dit zijn de vragen die ik het vaakst krijg.')}{cta_band('Je eerste triathlon begint met één gesprek.', 'Gratis kennismaking van een half uur: bellen of koffie in Rotterdam. Daarna beslis je of we doorgaan.')}'''
    write('index.html', head('home', 'Triathlon-coach in Rotterdam | Ryan Triathlon Coaching', 'Triathlon-coach in Rotterdam: zwemanalyse met onderwatervideo, trainingsschema\'s en begeleiding naar je eerste triathlon. Gratis kennismaking.', '', faq=faq_voor('home')) + body + footer())


def maand(iso):
    if not iso:
        return ''
    maanden = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
    parts = iso.split('-')
    if len(parts) < 2:  # alleen een jaar, zoals "2025"
        return f'<span class="when">{e(iso)}</span>'
    y, m = parts[:2]
    return f'<span class="when">{maanden[int(m)-1]} {y}</span>'


WEDSTRIJD_CATEGORIEEN = [
    ('hele', 'Hele triathlon'), ('halve', 'Halve triathlon'), ('kwart', 'Kwart triathlon'), ('achtste', 'Achtste triathlon'),
    ('overig-tri', 'Overige triathlon-afstand'), ('marathon', 'Marathon'), ('ultra', 'Ultraloop'),
]
MAANDEN_KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']


def maand_kort(iso):
    parts = (iso or '').split('-')
    if len(parts) < 2:
        return e(iso or '')
    return f'{MAANDEN_KORT[int(parts[1]) - 1]} {parts[0]}'


def wedstrijden_html():
    """Zelfde opbouw als renderWedstrijden() in site.js: per categorie een kop met aantal en een tabel."""
    zichtbaar = [w for w in DATA.get('wedstrijden', []) if not w.get('hidden')]
    out = ''
    for cat, label in WEDSTRIJD_CATEGORIEEN:
        items = [w for w in zichtbaar if w.get('categorie') == cat]
        if not items:
            continue
        rows = ''.join(f'<tr><td class="wanneer">{maand_kort(w["datum"])}</td><td>{e(w["naam"])}</td><td class="tijd">{e(w["tijd"])}</td></tr>' for w in items)
        finishes = len([w for w in items if 'DNF' not in (w.get('naam', '') + ' ' + w.get('tijd', '')).upper()])
        out += (f'<div class="palmares-groep"><h3>{e(label)}<span class="aantal"> · {finishes}×</span></h3>'
                f'<table class="palmares"><caption class="visually-hidden">{e(label)}</caption>'
                f'<thead><tr><th scope="col">Wanneer</th><th scope="col">Wedstrijd</th><th scope="col">Tijd</th></tr></thead>'
                f'<tbody>{rows}</tbody></table></div>')
    return out


# ------------------------------------------------------------------ diensten
def build_diensten():
    secs = ''
    for d in DATA['diensten']:
        vw = ''.join(f'<li>{e(x)}</li>' for x in d['voorWie'])
        wk = ''.join(f'<li>{e(x)}</li>' for x in d['watJeKrijgt'])
        detail = ('zwemanalyse.html', 'Alles over de zwemanalyse') if d['id'] == 'zwemanalyse' else ('race.html', 'Alles over begeleiding naar je race') if d['id'] == 'race' else ('werkwijze.html', 'Zo werkt het wekelijks bijsturen')
        intro = f'<p class="dienst-intro">{e(d["intro"])}</p>' if d.get('intro') else ''
        secs += f'''<section class="dienst-full" id="{d['id']}" aria-labelledby="h-{d['id']}">
          <h2 id="h-{d['id']}"><span class="icon">{icon(d['icon'])}</span>{e(d['titel'])}</h2>
          {intro}<p class="lang">{e(d['lang'])}</p>
          <div class="dienst-cols">
            <div class="card"><h3>Voor wie</h3><ul>{vw}</ul></div>
            <div class="card"><h3>Wat je krijgt</h3><ul>{wk}</ul></div>
          </div>
          <div class="dienst-prijs"><strong>Prijs: {e(d['prijsTekst'])}</strong><a class="btn btn-primary btn-sm wa-link" href="contact.html#formulier">Plan een kennismaking</a></div>
          <p class="dienst-links"><a href="{detail[0]}">{e(detail[1])}</a><a href="ervaringen.html">Ervaringen van atleten</a></p>
        </section>'''
    body = page_head('Diensten', 'Drie manieren om je te helpen', 'Zwemanalyse, een triathlon trainingsschema of begeleiding naar je eerste triathlon: los of gecombineerd. Alles begint met een gratis kennismaking in Rotterdam, zodat we weten of het klikt en wat je nodig hebt.') + f'''
    <div class="wrap" id="diensten-lijst">{secs}</div>
    <section class="section" aria-labelledby="prijs-title">
      <div class="wrap prijs-box">
        <h2 id="prijs-title">Over de prijzen</h2>
        <p id="prijs-intro">{e(DATA['prijsIntro'])}</p>
        <a class="btn btn-primary wa-link" href="contact.html#formulier" data-cta="primair">{e(DATA['hero']['ctaPrimair'])}</a>
      </div>
    </section>
{faq_section('Veelgestelde vragen over de diensten', 'diensten', alt=True)}'''
    write('diensten.html', head('diensten', 'Zwemanalyse, schema\'s en race | Ryan Triathlon Coaching', 'Zwemanalyse met onderwatervideo, een triathlon trainingsschema voor beginners en begeleiding naar je race. Van Ryan, triathlon-coach in Rotterdam.', 'diensten.html', faq=faq_voor('diensten')) + body + footer())


# --------------------------------------------------------------- zwemanalyse
def build_zwemanalyse():
    d = next(x for x in DATA['diensten'] if x['id'] == 'zwemanalyse')
    stappen = [
        ('Opname', 'We spreken af in een zwembad of open water. Ik film je slag van onder water en van de kant, een paar banen is genoeg.'),
        ('Analyse', 'Ik bekijk de beelden frame voor frame en spreek in wat ik zie, met tekeningen op het beeld.'),
        ('Bespreking', 'We lopen samen door de analyse: wat gaat goed, wat kost je snelheid, en welke drie tot vijf punten pakken we aan.'),
        ('Oefeningen', 'Je krijgt oefeningen die bij jouw punten passen. De analyse kijk je terug op je telefoon, zo vaak je wilt.'),
    ]
    st = ''.join(f'<div class="card"><div class="n" aria-hidden="true">{i+1}</div><h3>{e(t)}</h3><p>{e(x)}</p></div>' for i, (t, x) in enumerate(stappen))
    stills = ''
    for fn, lbl, cap in [('insteek', 'Insteek', 'Waar en hoe de hand het water in gaat'), ('ligging', 'Lichaamsligging', 'Hoe hoog ligt het lichaam, waar wijst het hoofd'), ('beenslag', 'Beenslag', 'Komt de beenslag uit de heup of uit de knie')]:
        stills += f'<div class="still"><img src="assets/img/analyse/{fn}.jpg" alt="Onderwaterbeeld uit een zwemanalyse in Rotterdam: {e(cap.lower())}" width="800" height="600" loading="lazy" decoding="async"><span>{e(lbl)}</span></div>'
    wk = ''.join(f'<li>{e(x)}</li>' for x in d['watJeKrijgt'])
    vw = ''.join(f'<li>{e(x)}</li>' for x in d['voorWie'])
    locatie = DATA.get('zwemLocatie') or 'een zwembad in Rotterdam of omgeving, of in open water'
    body = f'''    <div class="wrap page-head">
      <div class="kicker">Zwemanalyse</div>
      <h1>Zie eindelijk wat je onder water doet</h1>
      <p>Zwemmen is voor de meeste triatleten het lastigste onderdeel, omdat je jezelf niet kunt zien. Met een zwemanalyse in Rotterdam zie je het wél: onderwaterbeelden met ingesproken feedback, opgenomen in <span id="zwem-locatie">{e(locatie)}</span>.</p>
    </div>
''' + f'''
    <div class="wrap two-col" style="padding-bottom:40px">
      <div>
        <div class="analyse-video">
          <video id="voorbeeld-video" controls playsinline preload="metadata" poster="assets/video/analyse-poster.jpg" width="1280" height="720" src="{e(DATA['voorbeeldVideoUrl'])}"></video>
          <span class="cap"><strong>Voorbeeld van een zwemanalyse</strong> Zo ziet het eruit: wat ik zie, waar ik op let en wat je ermee kunt.</span>
        </div>
        <div class="stills" style="margin-top:12px">{stills}</div>
        <p class="muted small" style="margin-top:10px">Onderwaterbeelden uit een echte analyse, met toestemming van de zwemmer.</p>
      </div>
      <aside class="card aside-card">
        <h2>Wat je krijgt</h2>
        <ul>{wk}</ul>
        <h2 style="margin-top:8px">Voor wie</h2>
        <ul>{vw}</ul>
        <p style="margin:8px 0 0"><strong>Prijs: {e(d['prijsTekst'])}</strong></p>
        <a class="btn btn-primary wa-link" href="contact.html#formulier">Plan een zwemanalyse</a>
      </aside>
    </div>

    <section class="section section-alt" aria-labelledby="hoe-title">
      <div class="wrap">
        <div class="section-head"><h2 id="hoe-title">Zo gaat een zwemanalyse</h2></div>
        <div class="analyse-stappen">{st}</div>
        {links_rij([('diensten.html', 'Alle diensten'), ('race.html', 'Zwemanalyse zit in de begeleiding naar je race'), ('contact.html', 'Plan een zwemanalyse')])}
      </div>
    </section>

    <section class="section" aria-labelledby="sensor-title">
      <div class="wrap">
        <div class="section-head">
          <h2 id="sensor-title">Meten wat je niet kunt zien: kracht per hand</h2>
          <p class="muted">Video laat zien wát je doet. De sensor laat zien wat het oplevert.</p>
        </div>
        <div class="two-col" style="align-items:center">
          <div class="prose">
            <p>Voor wie een stap verder wil, zwem je een paar banen met een kleine sensor in elke hand: de eo SwimBETTER. Die meet honderd keer per seconde hoeveel kracht je hand op het water zet, in welke richting, en hoe je hand door het water beweegt. Daar komt een beeld uit dat je met het blote oog nooit ziet.</p>
            <p><strong>Wat je ermee te weten komt</strong></p>
            <ul>
              <li><strong>Links tegen rechts.</strong> Bijna iedereen heeft een sterke en een zwakke kant. Hier zie je het in watt per hand, en in hoe lang je glijdt, trekt en herstelt.</li>
              <li><strong>Waar je kracht heen gaat.</strong> Hoeveel procent stuwt je vooruit, en hoeveel duwt je omhoog, omlaag of opzij? Bij deze zwemmer gaat bijna een kwart van de kracht naar beneden in plaats van naar achteren. Dat is energie die je wel betaalt, maar die je niet vooruit brengt.</li>
              <li><strong>De baan van je hand.</strong> Van opzij, van boven en van voren. Slaat je hand over de middenlijn? Trek je te diep? Zit er een knik in?</li>
              <li><strong>Slag voor slag.</strong> Acht slagen over elkaar gelegd laten zien of je slag stabiel is, of dat je elke keer iets anders doet.</li>
            </ul>
            <p><strong>Waarom dit het verschil maakt.</strong> Een zwemcoach zegt vaak: "trek verder door" of "je rechterarm doet minder". Met de sensor hoef je dat niet te geloven, je ziet het. En belangrijker: na vier weken oefenen meten we opnieuw en zie je in getallen of het beter is geworden. Techniek verbeteren wordt zo iets waar je grip op hebt, in plaats van iets wat je hoopt.</p>
            <p class="muted small">Beelden uit een echte meting, met toestemming van de zwemmer.</p>
          </div>
          <figure class="sensor-figure">
            <img src="assets/img/sensor/sensor.jpg" alt="Krachtmeting bij de zwemanalyse: de eo SwimBETTER-sensor in de hand" width="900" height="900" loading="lazy" decoding="async">
            <figcaption>De sensor zit in een bandje om je hand. Je merkt er tijdens het zwemmen niets van.</figcaption>
          </figure>
        </div>
        <div class="sensor-grid">
          <figure><img src="assets/img/sensor/slagfases.jpg" alt="Zwemanalyse met sensor: slagfases per hand, glijden, trekken en herstel in procenten" width="900" height="1484" loading="lazy" decoding="async"><figcaption><strong>Slagfases</strong> Links glijdt 19% van de tijd, rechts 12%: de rechterhand begint eerder te trekken.</figcaption></figure>
          <figure><img src="assets/img/sensor/handbaan-boven.jpg" alt="Zwemanalyse met sensor: handbaan van boven gezien, acht slagen links en rechts over elkaar" width="900" height="1490" loading="lazy" decoding="async"><figcaption><strong>Handbaan van boven</strong> Acht slagen over elkaar. Links waaiert breder uit dan rechts.</figcaption></figure>
          <figure><img src="assets/img/sensor/handbaan-zij.jpg" alt="Zwemanalyse met sensor: handbaan van opzij gezien, diepte van de trek" width="900" height="1522" loading="lazy" decoding="async"><figcaption><strong>Handbaan van opzij</strong> Hoe diep gaat de hand, en waar begint de trek echt?</figcaption></figure>
          <figure><img src="assets/img/sensor/kracht.jpg" alt="Krachtmeting per hand: 48% voortstuwend, 24% omlaag" width="900" height="1366" loading="lazy" decoding="async"><figcaption><strong>Krachtverdeling</strong> 48% stuwt vooruit, 24% duwt omlaag. Daar zit winst.</figcaption></figure>
          <figure><img src="assets/img/sensor/vermogen.jpg" alt="Krachtmeting per hand in watt: links 62, rechts 57" width="900" height="1492" loading="lazy" decoding="async"><figcaption><strong>Vermogen per hand</strong> Links 62 W, rechts 57 W bij 25 slagen per minuut.</figcaption></figure>
        </div>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="tech-title">
      <div class="wrap prose">
        <h2 id="tech-title">Camera, sensor en viewer</h2>
        <p id="zwem-achtergrond">{e(DATA['zwemAchtergrond'])}</p>
        <p>Ik film onder water met een camera die scherp blijft, ook in een druk bad. De sensormeting hierboven is een optie bovenop de video; voor de meeste beginners is de video alleen al genoeg om de eerste grote stappen te zetten.</p>
        <p>De beelden bekijk je in een viewer waarin je kunt vertragen, stilzetten en frame voor frame door je slag stappen, met mijn tekeningen en ingesproken feedback op het beeld. Jij krijgt een link die je op je telefoon opent. Geen app installeren, geen account nodig.</p>
        <p>Een term die je vaak hoort is CSS, je kritische zwemsnelheid: het tempo dat je ongeveer een kwartier tot twintig minuten kunt volhouden. Die bepalen we met een korte test, en daar stemmen we je zwemtrainingen op af. Ik leg het je gewoon uit, je hoeft er niets van te weten om te beginnen.</p>
      </div>
    </section>
{faq_section('Veelgestelde vragen over de zwemanalyse', 'zwemanalyse')}{cta_band('Benieuwd wat jouw slag doet?', 'Plan een zwemanalyse of begin met een gratis kennismaking. Ik vertel je eerlijk of het voor jou zin heeft.')}'''
    write('zwemanalyse.html', head('zwemanalyse', 'Zwemanalyse Rotterdam – onderwatervideo en krachtmeting per hand | Ryan Triathlon Coaching', 'Zwemanalyse in Rotterdam: onderwatervideo van je slag met ingesproken feedback, optioneel krachtmeting per hand, en 3 tot 5 verbeterpunten met oefeningen.', 'zwemanalyse.html', faq=faq_voor('zwemanalyse')) + body + footer())


# ----------------------------------------------------------------------- race
def build_race():
    d = next(x for x in DATA['diensten'] if x['id'] == 'race')
    afst = ''
    for a in DATA['afstanden']:
        afst += f'''<article class="afstand" id="{a['id']}"><h3>{e(a['naam'])}</h3><div class="parts"><div class="part"><span>Zwemmen</span><strong>{e(a['zwem'])}</strong></div><div class="part"><span>Fietsen</span><strong>{e(a['fiets'])}</strong></div><div class="part"><span>Lopen</span><strong>{e(a['loop'])}</strong></div></div><span class="weken">Voorbereiding: {e(a['weken'])}</span><p>{e(a['voorWie'])}</p></article>'''
    rows = [
        ('Week 1–4', 'Basis', 'Rustig opbouwen: techniek in het water, duurtraining op de fiets, korte rustige loopjes. We testen je zones.'),
        ('Week 5–8', 'Opbouw', 'Iets meer volume. Eerste koppeltraining (fietsen en meteen lopen). Wisselzone oefenen in de tuin of op het parkeerterrein.'),
        ('Week 9–12', 'Specifiek', 'Trainingen gaan op het racetempo lijken. Open water zwemmen als dat kan. Voeding onderweg testen.'),
        ('Week 13–16', 'Verdieping', 'Alleen bij een 1/2 of hele: de lange duurtrainingen. Hier ga je merken hoe belangrijk herstel is.'),
        ('Laatste 2 weken', 'Taperen', 'Minder volume, intensiteit erin houden. Materiaal checken, raceplan doornemen, slapen.'),
        ('Racedag', 'Finish', 'Je weet precies wat je gaat doen: tempo, voeding, wisselzones. Ik ben bereikbaar en sta waar het kan langs het parcours.'),
    ]
    tbl = ''.join(f'<tr><td>{e(w)}</td><td>{e(f)}</td><td>{e(t)}</td></tr>' for w, f, t in rows)
    body = page_head('Begeleiding naar je race', 'Van inschrijving tot finish', 'Je eerste triathlon als beginner, of je eerste hele: ik maak er een plan van dat past bij je leven, en ik blijf erbij tot je over de streep bent. Vanuit Rotterdam, of online.') + f'''
    <section class="section" aria-labelledby="afst-title" style="padding-top:8px">
      <div class="wrap">
        <div class="section-head"><h2 id="afst-title">Welke afstand past bij jou?</h2><p>Wat verandert er per afstand, en hoeveel tijd mag je rekenen voor de voorbereiding.</p></div>
        <div class="afstanden" id="afstanden">{afst}</div>
      </div>
    </section>
    <section class="section section-alt" aria-labelledby="tl-title">
      <div class="wrap">
        <div class="section-head"><h2 id="tl-title">Voorbeeld van een voorbereiding</h2><p>Zo ziet een traject van 12 tot 20 weken er ongeveer uit. Jouw plan wijkt af, want jouw agenda en niveau zijn anders.</p></div>
        <div class="table-wrap"><table class="weekplan"><thead><tr><th>Periode</th><th>Fase</th><th>Waar het om gaat</th></tr></thead><tbody>{tbl}</tbody></table></div>
      </div>
    </section>
    <section class="section" aria-labelledby="inb-title">
      <div class="wrap two-col">
        <div class="prose">
          <h2 id="inb-title">Wat zit erin</h2>
          <p>{e(d['lang'])}</p>
          <ul class="checklist">{''.join(f'<li>{e(x)}</li>' for x in d['watJeKrijgt'])}</ul>
        </div>
        <aside class="card aside-card">
          <h2>Voor wie</h2>
          <ul>{''.join(f'<li>{e(x)}</li>' for x in d['voorWie'])}</ul>
          <p style="margin:8px 0 0"><strong>Prijs: {e(d['prijsTekst'])}</strong></p>
          <a class="btn btn-primary wa-link" href="contact.html#formulier">Plan een kennismaking</a>
        </aside>
      </div>
      <div class="wrap">{links_rij([('diensten.html', 'Alle diensten'), ('zwemanalyse.html', 'Over de zwemanalyse'), ('werkwijze.html', 'Zo werken we samen'), ('contact.html', 'Neem contact op')])}</div>
    </section>
{faq_section()}{cta_band('Welke race wordt het?', 'Vertel me welke afstand je in gedachten hebt en wanneer. Dan kijken we samen of het haalbaar is en wat ervoor nodig is.')}'''
    write('race.html', head('race', 'Naar je eerste triathlon | Ryan Triathlon Coaching', 'Begeleiding naar je eerste triathlon vanuit Rotterdam: intake, plan voor zwemmen, fietsen en lopen, wekelijks contact via WhatsApp en een raceplan.', 'race.html') + body + footer())


# ----------------------------------------------------------------------- over
def build_over():
    paras = ''.join(f'<p{" class=\"lead\"" if i == 0 else ""}>{e(v["tekst"])}</p>' for i, v in enumerate(DATA['verhaal']))
    results = ''.join(f'<div class="result"><span class="val">{e(r["waarde"])}</span><span class="lbl">{e(r["label"])}</span>{maand(r["datum"])}</div>' for r in DATA['resultaten'])
    wedstrijden = wedstrijden_html()
    body = f'''    <div class="wrap page-head">
      <div class="kicker">Over Ryan</div>
      <h1 id="over-kop">{e(DATA['overKop'])}</h1>
      <p id="over-intro">{e(DATA['overIntro'])}</p>
    </div>
''' + f'''
    <section class="section" aria-labelledby="story-title" style="padding-top:8px">
      <div class="wrap story">
        <figure class="photo" style="margin:0">
          <img src="assets/img/ryan-loop.jpg" alt="Ryan Douglas, triathlon-coach uit Rotterdam, tijdens een hardlooptraining langs het water" width="720" height="720" decoding="async" data-optional onerror="this.closest('.story').classList.add('no-img')">
        </figure>
        <div id="verhaal">{paras}</div>
      </div>
    </section>
    <section class="section section-alt" aria-labelledby="res-title">
      <div class="wrap">
        <div class="section-head"><h2 id="res-title">Resultaten</h2><p>Allemaal zelf gedaan, allemaal na te kijken.</p></div>
        <div class="results" id="resultaten">{results}</div>
        <p class="results-note" id="resultaten-noot">{e(DATA['resultatenNoot'])}</p>
      </div>
    </section>
    <section class="section" aria-labelledby="wed-title" id="wedstrijden"{'' if wedstrijden else ' hidden'}>
      <div class="wrap">
        <div class="section-head"><h2 id="wed-title">Wedstrijden</h2><p>Alles wat ik sinds 2016 aan de start stond en uitliep, per afstand.</p></div>
        <div class="palmares-lijst" id="wedstrijden-lijst">{wedstrijden}</div>
        <p class="results-note" id="wedstrijden-noot">Horlogetijden uit Garmin, daarom soms iets ruimer dan de officiële chiptijd. DNF = niet gefinisht.</p>
      </div>
    </section>
    <section class="section section-alt" aria-labelledby="club-title">
      <div class="wrap prose">
        <h2 id="club-title">Clubs en achtergrond</h2>
        <p id="clubs-tekst">{e(DATA['clubsTekst'])}</p>
        <p id="clubs-disclaimer">{e(DATA['clubsDisclaimer'])}</p>
        {links_rij([('zwemanalyse.html', 'Zwemanalyse'), ('diensten.html#schemas', "Trainingsschema's"), ('race.html', 'Begeleiding naar je race'), ('werkwijze.html', 'Zo werken we samen')])}
      </div>
    </section>
{cta_band('Zullen we kennismaken?', 'Een half uur bellen of koffie in Rotterdam. Gratis, en je zit nergens aan vast.')}'''
    write('over.html', head('over', 'Over Ryan Douglas, triathlon-coach | Ryan Triathlon Coaching', 'Ryan Douglas, triathlon-coach uit Rotterdam: vier hele triathlons, elf marathons, KNZB-zwemtrainer. Coacht een klein aantal atleten persoonlijk.', 'over.html') + body + footer())


# ------------------------------------------------------------------ werkwijze
def build_werkwijze():
    steps = ''.join(f'<li class="tl-step"><div class="tl-num" aria-hidden="true">{s["stap"]}</div><div><h2>{e(s["titel"])}</h2><p>{e(s["tekst"])}</p></div></li>' for s in DATA['werkwijze'])
    vw = ''.join(f'<li>{e(v["tekst"])}</li>' for v in DATA['verwachtingen'])
    body = page_head('Werkwijze', 'Zo werken we samen', 'Vier stappen, van een eerste gesprek tot je race. En een paar dingen die ik van jou verwacht, want coaching werkt alleen als het van twee kanten komt.') + f'''
    <section class="section" aria-labelledby="ww-title" style="padding-top:8px">
      <div class="wrap">
        <h2 id="ww-title" class="visually-hidden">De stappen</h2>
        <ol class="timeline" id="werkwijze-lijst">{steps}</ol>
      </div>
    </section>
    <section class="section section-alt" aria-labelledby="vw-title">
      <div class="wrap">
        <div class="section-head"><h2 id="vw-title">Wat ik van jou verwacht</h2></div>
        <ul class="checklist" id="verwachtingen">{vw}</ul>
      </div>
    </section>
    <section class="section" aria-labelledby="contact-title">
      <div class="wrap prose">
        <h2 id="contact-title">Contact tijdens het traject</h2>
        <p>Het meeste contact gaat via WhatsApp: korte vragen, een foto van je horloge, even melden dat je ziek bent. Ik reageer meestal dezelfde dag. Elke week kijk ik naar je trainingen in Strava of Garmin en pas ik waar nodig het schema aan. Grotere dingen, zoals een nieuw doel of een blessure, bespreken we even aan de telefoon.</p>
        <p>Zo werkt het bij alle <a href="diensten.html">diensten</a>: bij een <a href="diensten.html#schemas">trainingsschema</a>, bij <a href="race.html">begeleiding naar je race</a> en, in het klein, bij de oefeningen na een <a href="zwemanalyse.html">zwemanalyse</a>. Vragen vooraf? <a href="contact.html">Neem contact op</a>.</p>
      </div>
    </section>
{faq_section()}{cta_band()}'''
    write('werkwijze.html', head('werkwijze', 'Werkwijze: kennismaking tot race | Ryan Triathlon Coaching', 'Zo werkt de coaching: gratis kennismaking, intake met je Strava- of Garmin-data, een plan per vier weken en wekelijks contact via WhatsApp tot de race.', 'werkwijze.html') + body + footer())


# ----------------------------------------------------------------- ervaringen
def build_ervaringen():
    body = page_head('Ervaringen', 'Wat atleten zeggen', 'Ik ben net begonnen, dus deze pagina is nog kort. Elke ervaring hier is met naam en toestemming geplaatst.') + '''
    <section class="section" aria-labelledby="rev-title" style="padding-top:8px">
      <div class="wrap">
        <h2 id="rev-title" class="visually-hidden">Ervaringen</h2>
        <div class="grid grid-2" id="reviews" hidden></div>
        <div class="card empty" id="reviews-leeg"><p>De eerste ervaringen verschijnen hier binnenkort. Tot die tijd: bel me gerust, dan vertel ik je eerlijk hoe ik werk en voor wie het wel en niet geschikt is.</p><a class="btn btn-ghost btn-sm" href="contact.html">Neem contact op</a></div>
        <p class="results-note"><a href="zwemanalyse.html">Zelf een zwemanalyse boeken →</a> Of lees hoe <a href="race.html">begeleiding naar je race</a> werkt en wat de andere <a href="diensten.html">diensten</a> inhouden.</p>
      </div>
    </section>
''' + cta_band('Zelf de eerste zijn?', 'Ik werk met een klein aantal atleten, zodat ik iedereen echt kan volgen. Plan een gratis kennismaking.')
    write('ervaringen.html', head('ervaringen', 'Ervaringen van atleten | Ryan Triathlon Coaching', 'Wat atleten zeggen over triathlon-coach Ryan Douglas uit Rotterdam: zwemanalyse, trainingsschema\'s en begeleiding naar hun eerste triathlon.', 'ervaringen.html') + body + footer())


# -------------------------------------------------------------------- contact
def build_contact():
    doelen = ['1/8 triathlon', '1/4 triathlon', '1/2 triathlon', 'Hele triathlon', 'Beter leren zwemmen (zwemanalyse)', 'Sneller lopen of fietsen', 'Weet ik nog niet']
    opts = ''.join(f'<option>{e(x)}</option>' for x in doelen)
    body = page_head('Contact', 'Plan een kennismaking', 'Een half uur bellen of koffie in Rotterdam, gratis. Vertel kort wat je wilt, dan neem ik contact met je op.') + f'''
    <div class="wrap contact-grid" style="padding-bottom:72px">
      <form class="card" id="formulier" action="https://formspree.io/f/{FORMSPREE}" method="POST" novalidate>
        <h2 style="font-size:1.4rem">Stuur een bericht</h2>
        <p class="form-note">Velden met * zijn verplicht. Ik reageer meestal binnen een dag.</p>
        <input type="hidden" name="_subject" value="Kennismaking via ryantricoaching.nl">
        <input type="hidden" name="_language" value="nl">
        <input type="hidden" name="_next" id="f-next" value="{SITE}/bedankt.html">
        <div class="honey" aria-hidden="true"><label for="f-website">Laat dit veld leeg</label><input type="text" id="f-website" name="_gotcha" tabindex="-1" autocomplete="off"></div>
        <div class="form-row">
          <div class="field"><label for="f-naam">Je naam *</label><input type="text" id="f-naam" name="naam" autocomplete="name" required></div>
          <div class="field"><label for="f-email">E-mail *</label><input type="email" id="f-email" name="email" autocomplete="email" required></div>
        </div>
        <div class="field"><label for="f-doel">Wat is je doel?</label>
          <select id="f-doel" name="doel"><option value="">Kies…</option>{opts}</select>
        </div>
        <div class="field"><label for="f-situatie">Waar sta je nu?</label><input type="text" id="f-situatie" name="situatie" placeholder="Bijv. loop 2x per week, kan 200 m zwemmen, nog nooit een triathlon gedaan"></div>
        <div class="field"><label for="f-bericht">Bericht</label><textarea id="f-bericht" name="bericht" placeholder="Wanneer wil je je race doen, wat zijn je vragen, wat wil je weten?"></textarea></div>
        <div class="field">
          <label class="check"><input type="checkbox" name="avg" value="ja" required><span>Ik ga akkoord dat Ryan mijn gegevens gebruikt om dit bericht te beantwoorden (zie <a href="privacy.html">privacyverklaring</a>). *</span></label>
        </div>
        <div class="hero-cta" style="margin:0">
          <button class="btn btn-primary btn-lg" type="submit" id="f-submit">Verstuur bericht</button>
          <button class="btn btn-wa" type="button" id="f-wa-submit">{WA_SVG}<span>Liever via WhatsApp</span></button>
        </div>
        <div class="form-status" id="f-status" role="status" aria-live="polite"></div>
      </form>

      <aside class="contact-aside">
        <div class="card">
          <h2 style="font-size:1.2rem">Direct contact</h2>
          <div class="contact-links">
            <a class="btn btn-wa wa-link" href="#formulier">{WA_SVG}<span>WhatsApp</span></a>
            <a class="btn btn-ghost" id="btn-tel" href="#formulier" hidden><span>Bel <span data-k="phone"></span></span></a>
            <a class="btn btn-ghost" id="btn-mail" href="#formulier"><span>Mail Ryan</span></a>
          </div>
          <p class="placeholder-note" id="placeholder-note" style="margin:14px 0 0">Het WhatsApp-nummer wordt nog ingevuld in het beheer. Gebruik tot die tijd het formulier.</p>
        </div>
        <div class="card aside-card">
          <h2>Wat je kunt verwachten</h2>
          <ul>
            <li>Reactie binnen een dag</li>
            <li>Gratis kennismaking van een half uur</li>
            <li>Eerlijk advies, ook als coaching (nog) niet nodig is</li>
            <li>Geen verplichtingen</li>
          </ul>
        </div>
        <div class="card aside-card">
          <h2>Waar</h2>
          <p class="muted" style="margin:0">Kennismaking en zwemanalyse in <span data-k="regio">{e(DATA['info']['regio'])}</span>. Trainen doe je op je eigen plek; het contact gaat via WhatsApp en Strava of Garmin.</p>
          <ul class="social-links" hidden></ul>
        </div>
        <div class="card aside-card">
          <h2>Nog aan het kijken?</h2>
          <p class="muted" style="margin:0">Lees eerst over de <a href="zwemanalyse.html">zwemanalyse</a>, de <a href="diensten.html">diensten</a> of <a href="werkwijze.html">hoe ik werk</a>.</p>
        </div>
      </aside>
    </div>
{faq_section('Vragen vooraf')}'''
    write('contact.html', head('contact', 'Contact: gratis kennismaking | Ryan Triathlon Coaching', 'Plan een gratis kennismaking van een half uur met triathlon-coach Ryan in Rotterdam: via WhatsApp of het formulier. Reactie binnen een dag.', 'contact.html') + body + footer())


# -------------------------------------------------- bedankt, privacy, voorwaarden
def build_simple(name, title, desc, kicker, h1, lede, inner, noindex=False):
    body = page_head(kicker, h1, lede) + f'<div class="wrap prose" style="padding-bottom:64px">{inner}</div>\n'
    write(f'{name}.html', head(name, f'{title} | {NAME}', desc, f'{name}.html', noindex) + body + footer())


def build_rest():
    build_simple('bedankt', 'Bedankt voor je bericht', 'Je bericht is verstuurd. Ryan neemt binnen een dag contact met je op.', 'Verstuurd', 'Bedankt, je bericht is binnen', 'Ik neem meestal binnen een dag contact met je op. Kijk intussen gerust verder.',
                 '<p><a class="btn btn-primary" href="./">Terug naar de homepage</a> <a class="btn btn-ghost" href="race.html">Lees over de afstanden</a></p>', noindex=True)
    build_simple('privacy', 'Privacyverklaring', 'Hoe Ryan Triathlon Coaching omgaat met je gegevens: alleen wat nodig is om contact te houden en je te coachen. Geen cookies, geen doorverkoop.', 'Privacy', 'Privacyverklaring', 'Kort en zonder kleine lettertjes: ik gebruik alleen wat nodig is om je te helpen.', '''
<h2>Wie</h2>
<p>Deze website is van Ryan Douglas, handelend als Ryan Triathlon Coaching, Rotterdam. Vragen over je gegevens stel je via het <a href="contact.html">contactformulier</a> of WhatsApp.</p>
<h2>Welke gegevens en waarom</h2>
<ul>
  <li><strong>Contactformulier:</strong> je naam, e-mailadres, je doel en wat je schrijft. Alleen om je bericht te beantwoorden. Het formulier loopt via Formspree (VS, met EU-standaardcontractbepalingen); zij bewaren de inzending om hem aan mij door te geven.</li>
  <li><strong>WhatsApp:</strong> je nummer en wat je stuurt, in de WhatsApp-app van Ryan. Daarvoor geldt ook het privacybeleid van WhatsApp.</li>
  <li><strong>Tijdens de coaching:</strong> je trainingsgegevens (Strava of Garmin, als je die deelt), je agenda, blessuregeschiedenis en video-opnames van de zwemanalyse. Alleen om je te coachen; nooit gedeeld met anderen zonder dat je dat weet. Opnames gebruik ik niet op de website zonder je uitdrukkelijke toestemming.</li>
</ul>
<h2>Geen cookies, geen tracking</h2>
<p>De site zet geen cookies en gebruikt geen advertentie- of trackingdiensten. De website wordt gehost op GitHub Pages; GitHub kan daarvoor technische logs bijhouden (zoals je IP-adres). Lettertypen komen van Google Fonts; ook daarbij ziet Google je IP-adres.</p>
<h2>Bewaren</h2>
<p>Berichten bewaar ik zolang we contact hebben en daarna hoogstens een jaar. Coachinggegevens verwijder ik uiterlijk een jaar na het einde van het traject, tenzij je vraagt ze langer te bewaren.</p>
<h2>Je rechten</h2>
<p>Je mag altijd vragen welke gegevens ik van je heb, ze laten aanpassen of verwijderen. Stuur me een bericht en ik regel het. Ben je het ergens niet mee eens, dan kun je ook een klacht indienen bij de Autoriteit Persoonsgegevens.</p>
<p class="muted small">Laatst bijgewerkt: oktober 2026.</p>
<p>Zie ook de <a href="voorwaarden.html">voorwaarden</a>. Vragen over je gegevens of over de <a href="diensten.html">coaching</a>? <a href="contact.html">Neem contact op</a>.</p>''')
    build_simple('voorwaarden', 'Voorwaarden', 'De afspraken bij triathlon-coaching door Ryan Triathlon Coaching: eigen verantwoordelijkheid, prijzen, opzeggen, betaling en aansprakelijkheid.', 'Voorwaarden', 'Afspraken bij de coaching', 'Hobbybusiness, kleine schaal, maar wel duidelijke afspraken. Dit is wat we van elkaar mogen verwachten.', '''
<h2>1. Wat ik doe</h2>
<p>Ryan Triathlon Coaching (Ryan Douglas, Rotterdam) levert sportcoaching: zwemanalyses, trainingsschema's en begeleiding naar een triathlon. Ik ben geen arts, fysiotherapeut of diëtist. Adviezen zijn op basis van ervaring en algemene trainingsprincipes; bij medische vragen of klachten raadpleeg je een professional.</p>
<h2>2. Je eigen verantwoordelijkheid</h2>
<p>Je traint op eigen risico. Je bent zelf verantwoordelijk voor je gezondheid, je materiaal en de keuze om een training wel of niet te doen. Twijfel je of sporten verstandig is, overleg dan eerst met je huisarts. Blessures, ziekte of medicijngebruik meld je mij, zodat ik het plan daarop kan aanpassen.</p>
<h2>3. Afspraken en prijzen</h2>
<p>Prijzen zijn op aanvraag en spreken we vooraf af, per dienst of per periode. Wat is afgesproken, zet ik in een kort bericht op papier (e-mail of WhatsApp), zodat we het allebei kunnen nalezen. Betaling binnen 14 dagen na de factuur, tenzij anders afgesproken.</p>
<h2>4. Opzeggen en afzeggen</h2>
<p>Een begeleidingstraject kun je maandelijks opzeggen; de lopende maand wordt afgerond. Een afgesproken zwemanalyse of gesprek zeg je uiterlijk 24 uur van tevoren af; anders kan ik de kosten in rekening brengen. Ik doe hetzelfde: kan ik niet, dan plannen we opnieuw en betaal je niets extra.</p>
<h2>5. Aansprakelijkheid</h2>
<p>Ik doe mijn werk zorgvuldig, maar kan geen resultaat garanderen: een finish hangt van veel dingen af. Ik ben niet aansprakelijk voor blessures, schade of gemiste races, behalve bij opzet of grove nalatigheid van mijn kant. Eventuele aansprakelijkheid is beperkt tot het bedrag dat je voor de betreffende dienst hebt betaald.</p>
<h2>6. Materiaal en beelden</h2>
<p>Schema's en analyses zijn voor jou persoonlijk en niet bedoeld om door te geven. Video-opnames van de zwemanalyse blijven van jou; ik gebruik ze alleen voor jouw analyse en nooit publiek zonder jouw uitdrukkelijke toestemming.</p>
<h2>7. Nederlands recht</h2>
<p>Op deze afspraken is Nederlands recht van toepassing. Is er iets niet goed gegaan, dan lossen we dat eerst samen op in een gesprek.</p>
<p class="muted small">Versie oktober 2026.</p>
<p>Zie ook de <a href="privacy.html">privacyverklaring</a>. Vragen over deze afspraken of over de <a href="diensten.html">diensten</a>? <a href="contact.html">Neem contact op</a>.</p>''')


def write(name, content):
    (ROOT / name).write_text(content, encoding='utf-8')
    title = _re.search(r'<title>(.*?)</title>', content).group(1)
    desc = _re.search(r'<meta name="description" content="(.*?)">', content).group(1)
    waarschuwing = ''
    if len(html.unescape(desc)) > 155:
        waarschuwing += f'  ⚠ description {len(html.unescape(desc))} tekens (max 155)'
    if len(html.unescape(title)) > 60 and name != 'zwemanalyse.html':  # de zwemanalyse-title is bewust langer (zoekterm vooraan)
        waarschuwing += f'  ⚠ title {len(html.unescape(title))} tekens (richtlijn 60)'
    print('→', name, waarschuwing)


if __name__ == '__main__':
    build_index(); build_diensten(); build_zwemanalyse(); build_race(); build_over(); build_werkwijze(); build_ervaringen(); build_contact(); build_rest()


# --------------------------------------------------------------- versiestempel
def stamp_static(name):
    """Zet de huidige VERSION in statische pagina's die niet gegenereerd worden (beheer.html, 404.html)."""
    import re
    path = ROOT / name
    if not path.exists():
        return
    html = path.read_text(encoding='utf-8')
    html = re.sub(r'(<meta name="version" content=")[^"]*(")', rf'\g<1>{VERSION}\g<2>', html)
    html = re.sub(r'\?v=[0-9.\-]+', f'?v={VERSION}', html)
    path.write_text(html, encoding='utf-8')
    print('→', name, '(versie)')

stamp_static('beheer.html'); stamp_static('404.html')


def stamp_imports():
    """Zet ?v=VERSION achter de interne imports in assets/js, zodat na een deploy nooit
    een nieuwe module met een oude (gecachte) module gecombineerd wordt."""
    import re
    for js in sorted((ROOT / 'assets' / 'js').glob('*.js')):
        src = js.read_text(encoding='utf-8')
        new = re.sub(r"(from\s+')(\./[a-z]+\.js)(\?v=[0-9.\-]+)?(')", rf"\g<1>\g<2>?v={VERSION}\g<4>", src)
        new = re.sub(r"(import\(')(\./[a-z]+\.js)(\?v=[0-9.\-]+)?(')", rf"\g<1>\g<2>?v={VERSION}\g<4>", new)
        if new != src:
            js.write_text(new, encoding='utf-8')
            print('→', js.name, '(imports)')

stamp_imports()
