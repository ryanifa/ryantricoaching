/* De website opbouwen uit het databestand. Elke pagina bevat al de standaardinhoud
   (uit data/site.json); dit script vervangt die zodra de data uit de cache, de
   Gist of data/site.json binnen is. Alle renderers werken op filter(doc) uit
   store.js, nooit op het ruwe document. Alles via textContent (dom.js). */

import { CONFIG } from './config.js?v=2026.10.28-7';
import { el, $, $$, clear, telLink, whatsappLink } from './dom.js?v=2026.10.28-7';
import { loadForVisitors, filter, visibleReviews, featuredReviews, formatDatum, formatMaand, formatMaandKort, wedstrijdenPerCategorie } from './store.js?v=2026.10.28-7';

const page = document.body.dataset.page || 'home';

const isRealPhone = (p) => /\d{9,}/.test(String(p || '').replace(/\D/g, '')) && !/x/i.test(p);
const isRealEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e || '') && !/voorbeeld\.nl$/i.test(e);
const isUrl = (u) => /^https?:\/\//i.test(u || '');
const WA_TEXT = 'Hoi Ryan, ik wil graag een kennismaking plannen. ';

function waNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `31${d.slice(1)}`;
  return d;
}

/** Iconen voor diensten en startpunten (SVG via DOM, nooit innerHTML). */
const svgNS = 'http://www.w3.org/2000/svg';
function svgIcon(kind) {
  const paths = {
    zwem: ['M3 17c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0', 'M3 12c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0', 'M14 7.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0'],
    fiets: ['M5.5 17.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M18.5 17.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M5.5 14 9 7h6l3.5 7', 'M9 7 12 14h6.5', 'M14 4h2'],
    loop: ['M13 4.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0', 'M7 21l3-6 3 2 1-4-3-2 2-4 3 3 3-1', 'M10 11 7 10l-3 3'],
  };
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of paths[kind] || paths.loop) {
    const p = document.createElementNS(svgNS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

/* --------------------------------------------------------------- render */

function render(raw, meta) {
  const doc = filter(raw); // de enige weg: alles hieronder ziet alleen wat getoond mag worden
  const info = doc.info;
  $('#demo-banner') && ($('#demo-banner').hidden = meta.source !== 'demo');
  const ann = $('#announcement');
  if (ann) { ann.textContent = info.announcement; ann.hidden = !info.announcement; }
  $('#jaar') && ($('#jaar').textContent = String(new Date().getFullYear()));

  const values = { phone: info.phone, whatsapp: info.whatsapp || info.phone, email: info.email, kvk: info.kvk, regio: info.regio, name: info.name };
  for (const node of $$('[data-k]')) {
    const v = values[node.dataset.k];
    if (v !== undefined && v !== '') node.textContent = v;
  }
  const tagline = $('#footer-tagline');
  if (tagline && info.tagline) tagline.textContent = info.tagline;
  for (const node of $$('[data-cta="primair"]')) if (doc.hero.ctaPrimair) node.textContent = doc.hero.ctaPrimair;
  const kvk = $('#footer-kvk');
  if (kvk) kvk.hidden = !info.kvk;

  renderContactLinks(doc);
  renderSocial(doc);
  renderFaq(doc);
  renderReviewBlocks(doc);
  if (page === 'home') renderHome(doc);
  if (page === 'diensten') renderDiensten(doc);
  if (page === 'race') renderRace(doc);
  if (page === 'over') renderOver(doc);
  if (page === 'werkwijze') renderWerkwijze(doc);
  if (page === 'contact') renderContact(doc);
}

function renderContactLinks(doc) {
  const { phone, whatsapp, email } = doc.info;
  const wa = whatsapp || phone;
  const set = (sel, ok, href, fallback = 'contact.html#formulier') => {
    for (const a of $$(sel)) {
      a.href = ok ? href : fallback;
      if (!ok) a.title = 'Nummer volgt; gebruik het formulier';
      if (ok && /^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
    }
  };
  set('.wa-link', isRealPhone(wa), whatsappLink(waNumber(wa), WA_TEXT));
  set('#btn-tel', isRealPhone(phone), telLink(phone));
  set('#btn-mail', isRealEmail(email), `mailto:${email}?subject=${encodeURIComponent('Kennismaking triathlon-coaching')}`);
  const note = $('#placeholder-note');
  if (note) note.hidden = isRealPhone(wa);
  const mailRow = $('#contact-mail');
  if (mailRow) mailRow.hidden = !isRealEmail(email);
  const telRow = $('#contact-tel');
  if (telRow) telRow.hidden = !isRealPhone(phone);
}

function renderSocial(doc) {
  const { instagram, strava, facebook, linkedin } = doc.info;
  const links = [
    instagram && ['Instagram', isUrl(instagram) ? instagram : `https://www.instagram.com/${encodeURIComponent(instagram.replace(/^@/, ''))}/`],
    strava && ['Strava', isUrl(strava) ? strava : `https://www.strava.com/athletes/${encodeURIComponent(strava)}`],
    facebook && ['Facebook', isUrl(facebook) ? facebook : `https://www.facebook.com/${encodeURIComponent(facebook)}`],
    linkedin && ['LinkedIn', isUrl(linkedin) ? linkedin : `https://www.linkedin.com/in/${encodeURIComponent(linkedin.replace(/^\/?in\//, ''))}/`],
  ].filter(Boolean);
  for (const box of $$('.social-links')) {
    box.hidden = !links.length;
    clear(box).append(...links.map(([name, href]) => el('li', {}, el('a', { href, rel: 'noopener', target: '_blank', text: name }))));
  }
  for (const h of $$('.social-head')) h.hidden = !links.length;
}

function faqItem(f) {
  return el('details', { class: 'faq' }, [el('summary', { text: f.vraag }), el('p', { text: f.antwoord })]);
}

function renderFaq(doc) {
  const box = $('#faq');
  if (!box) return;
  const items = doc.faq.filter((f) => f.vraag);
  if (items.length) clear(box).append(...items.map(faqItem));
}

function reviewCard(r) {
  return el('article', { class: 'card review' }, [
    el('blockquote', { text: r.tekst }),
    el('div', { class: 'review-who' }, [
      el('div', { class: 'avatar', 'aria-hidden': 'true', text: (r.naam[0] || '?').toUpperCase() }),
      el('div', {}, [el('strong', { text: r.naam }), el('span', { text: [r.afstand, formatMaand(r.datum)].filter(Boolean).join(' · ') })]),
    ]),
  ]);
}

/** Ervaringen op de homepage (uitgelicht, max 3) en op ervaringen.html (alles). */
function renderReviewBlocks(doc) {
  const box = $('#reviews');
  if (!box) return;
  const list = page === 'ervaringen' ? visibleReviews(doc) : featuredReviews(doc, 3);
  clear(box).append(...list.map(reviewCard));
  box.hidden = list.length === 0;
  const empty = $('#reviews-leeg');
  if (empty) empty.hidden = list.length > 0;
}

/* ----------------------------------------------------------------- home */

function renderHome(doc) {
  const { hero } = doc;
  if (hero.kop) $('#hero-title').textContent = hero.kop;
  if (hero.sub) $('#hero-sub').textContent = hero.sub;
  if (hero.ctaSecundair) $('#hero-cta-2').textContent = hero.ctaSecundair;

  if (doc.startpunten.length) {
    const icons = ['loop', 'fiets', 'zwem'];
    clear($('#startpunten')).append(...doc.startpunten.map((s, i) => el('a', { class: 'start-card', href: s.link }, [
      el('div', { class: 'icon' }, svgIcon(icons[i % icons.length])),
      el('h3', { text: s.titel }),
      el('p', { text: s.tekst }),
      el('span', { class: 'more', text: s.knop || 'Lees meer' }),
    ])));
  }
  if (doc.diensten.length) {
    clear($('#diensten')).append(...doc.diensten.map((d) => el('div', { class: 'dienst' }, [
      el('div', { class: 'icon' }, svgIcon(d.icon)),
      el('div', {}, [el('h3', { text: d.titel }), el('p', { text: d.kort }), el('a', { href: dienstLink(d), text: 'Meer over ' + d.titel.toLowerCase() })]),
    ])));
  }
  if (doc.usps.length) {
    clear($('#usps')).append(...doc.usps.map((u, i) => el('div', { class: 'usp' }, [el('div', { class: 'num', 'aria-hidden': 'true', text: String(i + 1) }), el('h3', { text: u.titel }), el('p', { text: u.tekst })])));
  }
  if (doc.verhaal.length) {
    const st = $('#story-title');
    if (st && doc.overKop) st.textContent = doc.overKop;
    const t = $('#verhaal-teaser');
    if (t) t.textContent = doc.verhaal[0].tekst;
  }
  renderResultaten(doc);
  renderSteps(doc, '#steps');
}

const dienstLink = (d) => (d.id === 'zwemanalyse' ? 'zwemanalyse.html' : d.id === 'race' ? 'race.html' : `diensten.html#${d.id}`);

function renderResultaten(doc) {
  const box = $('#resultaten');
  if (!box) return;
  if (doc.resultaten.length) {
    clear(box).append(...doc.resultaten.map((r) => el('div', { class: 'result' }, [
      el('span', { class: 'val', text: r.waarde }),
      el('span', { class: 'lbl', text: r.label }),
      r.datum ? el('span', { class: 'when', text: formatMaand(r.datum) }) : null,
    ])));
  }
  const note = $('#resultaten-noot');
  if (note && doc.resultatenNoot) note.textContent = doc.resultatenNoot;
}

function renderSteps(doc, sel) {
  const box = $(sel);
  if (!box || !doc.werkwijze.length) return;
  clear(box).append(...doc.werkwijze.slice(0, 4).map((s, i) => el('li', { class: 'step' }, [
    el('div', { class: 'n', 'aria-hidden': 'true', text: String(s.stap || i + 1) }),
    el('h3', { text: s.titel }),
    el('p', { text: s.tekst }),
  ])));
}

/* ------------------------------------------------------------- diensten */

function renderDiensten(doc) {
  const box = $('#diensten-lijst');
  if (!box) return;
  if (doc.diensten.length) {
    clear(box).append(...doc.diensten.map((d) => el('section', { class: 'dienst-full', id: d.id, 'aria-labelledby': `h-${d.id}` }, [
      el('h2', { id: `h-${d.id}` }, [el('span', { class: 'icon' }, svgIcon(d.icon)), d.titel]),
      el('p', { class: 'lang', text: d.lang || d.kort }),
      el('div', { class: 'dienst-cols' }, [
        el('div', { class: 'card' }, [el('h3', { text: 'Voor wie' }), el('ul', {}, d.voorWie.map((x) => el('li', { text: x })))]),
        el('div', { class: 'card' }, [el('h3', { text: 'Wat je krijgt' }), el('ul', {}, d.watJeKrijgt.map((x) => el('li', { text: x })))]),
      ]),
      el('div', { class: 'dienst-prijs' }, [
        el('strong', { text: `Prijs: ${d.prijsTekst}` }),
        el('a', { class: 'btn btn-primary btn-sm wa-link', href: 'contact.html#formulier', text: 'Plan een kennismaking' }),
      ]),
    ])));
    renderContactLinks(doc);
  }
  const za = $('#zwem-achtergrond');
  if (za && doc.zwemAchtergrond) za.textContent = doc.zwemAchtergrond;
  const vb = $('#voorbeeld-video');
  if (vb && doc.voorbeeldVideoUrl && vb.getAttribute('src') !== doc.voorbeeldVideoUrl) { vb.setAttribute('src', doc.voorbeeldVideoUrl); vb.load(); }
  const intro = $('#prijs-intro');
  if (intro && doc.prijsIntro) intro.textContent = doc.prijsIntro;
}

/* ----------------------------------------------------------------- race */

function renderRace(doc) {
  const box = $('#afstanden');
  if (!box || !doc.afstanden.length) return;
  clear(box).append(...doc.afstanden.map((a) => el('article', { class: 'afstand', id: a.id }, [
    el('h3', { text: a.naam }),
    el('div', { class: 'parts' }, [
      el('div', { class: 'part' }, [el('span', { text: 'Zwemmen' }), el('strong', { text: a.zwem })]),
      el('div', { class: 'part' }, [el('span', { text: 'Fietsen' }), el('strong', { text: a.fiets })]),
      el('div', { class: 'part' }, [el('span', { text: 'Lopen' }), el('strong', { text: a.loop })]),
    ]),
    a.weken ? el('span', { class: 'weken', text: `Voorbereiding: ${a.weken}` }) : null,
    el('p', { text: a.voorWie }),
  ])));
}

/* ----------------------------------------------------------------- over */

function renderOver(doc) {
  const box = $('#verhaal');
  if (box && doc.verhaal.length) clear(box).append(...doc.verhaal.map((v, i) => el('p', { class: i === 0 ? 'lead' : null, text: v.tekst })));
  const kop = $('#over-kop');
  if (kop && doc.overKop) kop.textContent = doc.overKop;
  const intro = $('#over-intro');
  if (intro && doc.overIntro) intro.textContent = doc.overIntro;
  const clubs = $('#clubs-tekst');
  if (clubs && doc.clubsTekst) clubs.textContent = doc.clubsTekst;
  const disc = $('#clubs-disclaimer');
  if (disc && doc.clubsDisclaimer) disc.textContent = doc.clubsDisclaimer;
  renderResultaten(doc);
  renderWedstrijden(doc);
}

/** De wedstrijdenlijst op "Over Ryan": per categorie een kop met aantal en een compacte tabel. */
function renderWedstrijden(doc) {
  const box = $('#wedstrijden-lijst');
  if (!box) return;
  const groepen = wedstrijdenPerCategorie(doc);
  const sectie = $('#wedstrijden');
  if (sectie) sectie.hidden = groepen.length === 0;
  clear(box).append(...groepen.map((g) => el('div', { class: 'palmares-groep' }, [
    el('h3', {}, [g.label, el('span', { class: 'aantal', text: ` · ${g.items.filter((w) => !/DNF/i.test(w.naam + ' ' + w.tijd)).length}×` })]),
    el('table', { class: 'palmares' }, [
      el('caption', { class: 'visually-hidden', text: g.label }),
      el('thead', {}, el('tr', {}, [el('th', { scope: 'col', text: 'Wanneer' }), el('th', { scope: 'col', text: 'Wedstrijd' }), el('th', { scope: 'col', text: 'Tijd' })])),
      el('tbody', {}, g.items.map((w) => el('tr', {}, [
        el('td', { class: 'wanneer', text: formatMaandKort(w.datum) }),
        el('td', { text: w.naam }),
        el('td', { class: 'tijd', text: w.tijd }),
      ]))),
    ]),
  ])));
}

/* ------------------------------------------------------------ werkwijze */

function renderWerkwijze(doc) {
  const box = $('#werkwijze-lijst');
  if (box && doc.werkwijze.length) {
    clear(box).append(...doc.werkwijze.map((s, i) => el('li', { class: 'tl-step' }, [
      el('div', { class: 'tl-num', 'aria-hidden': 'true', text: String(s.stap || i + 1) }),
      el('div', {}, [el('h2', { text: s.titel }), el('p', { text: s.tekst })]),
    ])));
  }
  const vw = $('#verwachtingen');
  if (vw && doc.verwachtingen.length) clear(vw).append(...doc.verwachtingen.map((v) => el('li', { text: v.tekst })));
}

/* -------------------------------------------------------------- contact */

let contactDoc = null;
function renderContact(doc) { contactDoc = doc; }

function setupContactForm() {
  const form = $('#formulier');
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const doel = $('#f-doel');
  if (params.get('doel') && doel) doel.value = params.get('doel');
  const next = $('#f-next');
  if (next) next.value = new URL('bedankt.html', location.href).href;

  const id = CONFIG.formspreeId;
  const configured = id && !/FORMSPREE_ID/.test(id);
  if (configured) form.action = `https://formspree.io/f/${encodeURIComponent(id)}`;

  const status = $('#f-status');
  const submit = $('#f-submit');
  const waBtn = $('#f-wa-submit');

  /** Alle velden als leesbaar WhatsApp-bericht. */
  const bericht = () => {
    const v = (sel) => ($(sel)?.value || '').trim();
    const opt = (label, val) => (val ? `${label}${val}` : null);
    return [
      'Hoi Ryan, ik wil graag een kennismaking plannen.',
      '',
      `Naam: ${v('#f-naam')}`,
      opt('Doel: ', $('#f-doel')?.selectedOptions[0]?.value ? $('#f-doel').selectedOptions[0].text : ''),
      opt('Huidige situatie: ', v('#f-situatie')),
      opt('E-mail: ', v('#f-email')),
      opt('\n', v('#f-bericht')),
    ].filter((r) => r !== null).join('\n');
  };

  const valideer = () => {
    status.className = 'form-status';
    if (!form.checkValidity()) {
      form.reportValidity();
      status.classList.add('error');
      status.textContent = 'Vul de verplichte velden in.';
      return false;
    }
    return true;
  };

  // Primair: per e-mail via Formspree. Zonder id: uitleg en WhatsApp als alternatief.
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!valideer()) return;
    if (!configured) {
      status.classList.add('error');
      status.textContent = 'Het formulier is nog niet gekoppeld. Stuur je bericht via WhatsApp, of probeer het later nog eens.';
      return;
    }
    submit.disabled = true;
    status.textContent = 'Versturen…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      location.href = new URL('bedankt.html', location.href).href;
    } catch {
      status.classList.add('error');
      status.textContent = 'Versturen lukte niet. Probeer het via WhatsApp of mail me rechtstreeks.';
    } finally {
      submit.disabled = false;
    }
  });

  // Secundair: hetzelfde bericht via WhatsApp (de bezoeker verstuurt het daar zelf).
  if (waBtn) waBtn.addEventListener('click', () => {
    if (!valideer()) return;
    const info = contactDoc?.info || {};
    const nummer = info.whatsapp || info.phone;
    if (!isRealPhone(nummer)) {
      status.classList.add('error');
      status.textContent = 'Het WhatsApp-nummer is nog niet ingevuld (beheer → Info).';
      return;
    }
    status.classList.add('ok');
    status.textContent = 'WhatsApp wordt geopend met je bericht. Druk daar op verzenden.';
    location.href = whatsappLink(waNumber(nummer), bericht());
  });
}

/* ----------------------------------------------------- statistieken */

/** GoatCounter (cookieloos, geen banner nodig), alleen als er een code in config.js staat. */
function setupAnalytics() {
  const code = CONFIG.goatcounter;
  if (!code || location.hostname === 'localhost') return;
  document.head.append(el('script', { 'data-goatcounter': `https://${code}.goatcounter.com/count`, async: true, src: 'https://gc.zgo.at/count.js' }));
}

/* --------------------------------------------------------- versiecheck */

/**
 * Vergelijkt de versie in de pagina (meta name=version) met VERSION op de server,
 * zonder cache. Nieuwer? Dan een balk met de melding en een knop; pas na de klik
 * wordt de pagina ververst (met cache-buster), nooit ongevraagd.
 */
function checkVersion() {
  const current = document.querySelector('meta[name="version"]')?.content;
  if (!current) return;
  fetch(new URL('../../VERSION', import.meta.url), { cache: 'no-store' })
    .then((r) => (r.ok ? r.text() : ''))
    .then((v) => {
      v = v.trim();
      if (!v || v === current || $('#update-bar')) return;
      const reload = () => {
        const url = new URL(location.href);
        url.searchParams.set('v', v);
        location.replace(url.toString());
      };
      const bar = el('div', { id: 'update-bar', class: 'update-bar', role: 'status' }, [
        `Er is een nieuwe versie van de site (v${v}). `,
        el('button', { type: 'button', class: 'btn btn-primary btn-sm', text: 'Vernieuwen', onclick: reload }),
      ]);
      document.body.prepend(bar);
    })
    .catch(() => { /* offline: niets doen */ });
}
checkVersion();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkVersion(); });
window.addEventListener('pageshow', (ev) => { if (ev.persisted) checkVersion(); });

/* ------------------------------------------------------------- opstart */

/** Huidige pagina markeren in de navigatie. */
for (const a of $$('.nav a, .menu-panel a')) {
  if (a.getAttribute('href') === `${page}.html`) a.setAttribute('aria-current', 'page');
}
/** Foto-placeholder: zonder bestand verbergen we de foto en tonen het beeldmerk. */
for (const img of $$('img[data-optional]')) {
  const fail = () => img.closest('.hero-photo, .story')?.classList.add('no-img');
  if (img.complete && img.naturalWidth === 0) fail();
  img.addEventListener('error', fail);
}

setupContactForm();
setupAnalytics();
loadForVisitors(render).catch((err) => console.warn('Data laden mislukt:', err));
