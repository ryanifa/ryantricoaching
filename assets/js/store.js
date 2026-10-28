/* Het laden van het databestand, voor bezoekers en beheer.
   Volgorde van vertrouwen: demo-data (alleen in de browser die demo aanzette),
   dan de live Gist, met een lokale cache en het meegeleverde data/site.json als
   terugval zodat de pagina altijd iets toont, ook offline. */

import { CONFIG } from './config.js?v=2026.10.28-4';
import { readGist, readGistRaw } from './gist.js?v=2026.10.28-4';

const KEYS = {
  cache: 'rtc.cache',
  demo: 'rtc.demo',
  gistId: 'rtc.gistId',
};

export function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* privémodus: prima, alleen dit bezoek */ }
}

/** De Gist waar de site uit leest: die in config.js, of die het beheer op dit apparaat koppelde. */
export function activeGistId() {
  return CONFIG.gistId || storageGet(KEYS.gistId, '') || '';
}

export function setLocalGistId(id) { storageSet(KEYS.gistId, id || null); }

export function demoDoc() { return storageGet(KEYS.demo); }
export function setDemoDoc(doc) { storageSet(KEYS.demo, doc); }

export function cacheDoc(doc, updatedAt) { storageSet(KEYS.cache, { doc, updatedAt, gistId: activeGistId() }); }

export async function bundledDoc() {
  const res = await fetch(new URL('../../data/site.json', import.meta.url), { cache: 'no-cache' });
  return normalize(await res.json());
}

/**
 * Roept `render(doc, meta)` aan zodra er iets beschikbaar is, en nog eens als
 * er versere data binnenkomt. Bezoekers wachten nooit op GitHub.
 */
export async function loadForVisitors(render) {
  const demo = demoDoc();
  if (demo) {
    render(normalize(demo), { source: 'demo' });
    return;
  }

  const gistId = activeGistId();
  const cached = storageGet(KEYS.cache);
  const cachedValid = cached?.doc && cached.gistId === gistId;
  let shown = false;
  if (cachedValid) {
    render(normalize(cached.doc), { source: 'cache' });
    shown = true;
  }

  if (gistId) {
    try {
      const { doc, updatedAt } = await readGist(gistId, CONFIG.gistFile);
      if (!cachedValid || cached.updatedAt !== updatedAt) {
        cacheDoc(doc, updatedAt);
        render(normalize(doc), { source: 'gist' });
      }
      return;
    } catch (err) {
      console.warn('Live data (API) niet beschikbaar:', err.message);
    }
    if (CONFIG.gistOwner && gistId === CONFIG.gistId) {
      try {
        const { doc } = await readGistRaw(CONFIG.gistOwner, gistId, CONFIG.gistFile);
        if (!cachedValid || JSON.stringify(doc) !== JSON.stringify(cached.doc)) {
          cacheDoc(doc, cached?.updatedAt ?? null);
          render(normalize(doc), { source: 'gist-raw' });
        }
        return;
      } catch (err) {
        console.warn('Live data (CDN) niet beschikbaar, terugval:', err.message);
      }
    }
    if (shown) return;
  }

  if (!shown) render(await bundledDoc(), { source: 'bundled' });
}

/* ------------------------------------------------------------- het model */

export const DIENST_ICONS = ['zwem', 'fiets', 'loop'];
export const AFSTANDEN = ['1/8 triathlon', '1/4 triathlon', '1/2 triathlon', 'Hele triathlon', '5 km', '10 km', 'Halve marathon', 'Marathon', 'Zwemanalyse', 'Anders'];
/** Categorieën van de wedstrijdenlijst, in de volgorde waarin de site ze toont. */
export const WEDSTRIJD_CATEGORIEEN = [
  ['hele', 'Hele triathlon'],
  ['halve', 'Halve triathlon'],
  ['kwart', 'Kwart triathlon'],
  ['achtste', 'Achtste triathlon'],
  ['overig-tri', 'Overige triathlon-afstand'],
  ['marathon', 'Marathon'],
  ['ultra', 'Ultraloop'],
];
const CATEGORIE_IDS = WEDSTRIJD_CATEGORIEEN.map(([id]) => id);

const str = (v, d = '') => (typeof v === 'string' ? v : v === null || v === undefined ? d : String(v));
const num = (v, d = null) => {
  if (v === null || v === undefined || v === '') return d;
  const n = Number(typeof v === 'string' ? v.replace(',', '.') : v);
  return Number.isFinite(n) ? n : d;
};
const int = (v, d = 0) => Math.round(num(v, d) ?? d);
const arr = (v) => (Array.isArray(v) ? v : []);
const strList = (v) => arr(v).map((x) => str(x)).filter(Boolean);
const isoDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? str(v) : '');
/** Jaar-maand ("2026-04") of volledige datum; anders leeg. */
const maandOfDatum = (v) => (/^\d{4}-\d{2}(-\d{2})?$/.test(str(v)) ? str(v) : '');
const oneOf = (v, list, d) => (list.includes(v) ? v : d);
let counter = 0;
const ensureId = (v, prefix) => (v === 0 || v ? String(v) : `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`);

/** Stabiele id uit een tekst: "faq-moet-ik-al-kunnen-zwemmen". */
export function slug(text, prefix = '') {
  const base = String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '');
  return `${prefix}${base || 'item'}`;
}
/** Tekstregel met id: accepteert een platte string (migratie) of {id, tekst}. */
const tekstItem = (v, prefix) => {
  const tekst = typeof v === 'string' ? v : str(v?.tekst);
  const id = typeof v === 'string' ? '' : str(v?.id);
  return { id: id || slug(tekst, prefix), tekst };
};

/** Vult alles aan met standaardwaarden, zodat de renderers nooit hoeven te guarden (spec §6). */
export function normalize(input) {
  const doc = input && typeof input === 'object' ? input : {};
  const info = doc.info || {};
  const hero = doc.hero && typeof doc.hero === 'object' ? doc.hero : {};
  return {
    version: 1,
    info: {
      name: str(info.name, 'Ryan Triathlon Coaching') || 'Ryan Triathlon Coaching',
      tagline: str(info.tagline),
      kop: str(info.kop),
      intro: str(info.intro),
      announcement: str(info.announcement),
      phone: str(info.phone),
      whatsapp: str(info.whatsapp),
      email: str(info.email),
      kvk: str(info.kvk),
      instagram: str(info.instagram),
      strava: str(info.strava),
      facebook: str(info.facebook),
      linkedin: str(info.linkedin),
      regio: str(info.regio, 'Rotterdam en omgeving'),
      media: { gistId: str(info.media?.gistId), owner: str(info.media?.owner) },
    },
    hero: {
      kop: str(hero.kop),
      sub: str(hero.sub),
      ctaPrimair: str(hero.ctaPrimair),
      ctaSecundair: str(hero.ctaSecundair),
    },
    startpunten: arr(doc.startpunten).map((s) => ({
      id: str(s?.id) || slug(s?.titel, 'sp-'),
      titel: str(s?.titel),
      tekst: str(s?.tekst),
      link: str(s?.link, 'diensten.html') || 'diensten.html',
      knop: str(s?.knop),
    })),
    diensten: arr(doc.diensten).map((d) => ({
      id: str(d?.id) || slug(d?.titel, 'dienst-'),
      titel: str(d?.titel),
      kort: str(d?.kort),
      lang: str(d?.lang),
      voorWie: strList(d?.voorWie),
      watJeKrijgt: strList(d?.watJeKrijgt),
      prijsTekst: str(d?.prijsTekst, 'Op aanvraag') || 'Op aanvraag',
      icon: oneOf(str(d?.icon), DIENST_ICONS, 'loop'),
      hidden: !!d?.hidden,
    })),
    prijsIntro: str(doc.prijsIntro),
    afstanden: arr(doc.afstanden).map((a) => ({
      id: str(a?.id) || slug(a?.naam, 'afst-'),
      naam: str(a?.naam),
      zwem: str(a?.zwem),
      fiets: str(a?.fiets),
      loop: str(a?.loop),
      weken: str(a?.weken),
      voorWie: str(a?.voorWie),
    })),
    usps: arr(doc.usps).map((u) => ({ id: str(u?.id) || slug(u?.titel, 'usp-'), titel: str(u?.titel), tekst: str(u?.tekst) })),
    resultaten: arr(doc.resultaten).map((r) => ({
      id: str(r?.id) || slug(r?.label, 'res-'),
      label: str(r?.label),
      waarde: str(r?.waarde),
      datum: maandOfDatum(r?.datum),
      hidden: !!r?.hidden,
    })),
    resultatenNoot: str(doc.resultatenNoot),
    wedstrijden: arr(doc.wedstrijden).map((w) => {
      const categorie = oneOf(str(w?.categorie), CATEGORIE_IDS, 'overig-tri');
      const datum = isoDate(w?.datum);
      return {
        id: str(w?.id) || `w-${categorie}-${datum.replace(/-/g, '') || slug(w?.naam)}`,
        datum,
        naam: str(w?.naam),
        categorie,
        tijd: str(w?.tijd),
        hidden: !!w?.hidden,
      };
    }),
    clubsTekst: str(doc.clubsTekst),
    clubsDisclaimer: str(doc.clubsDisclaimer),
    voorbeeldVideoUrl: str(doc.voorbeeldVideoUrl),
    overKop: str(doc.overKop),
    overIntro: str(doc.overIntro),
    zwemAchtergrond: str(doc.zwemAchtergrond),
    werkwijze: arr(doc.werkwijze).map((s, i) => ({
      id: str(s?.id) || slug(s?.titel, 'ww-'),
      stap: int(s?.stap, i + 1) || i + 1,
      titel: str(s?.titel),
      tekst: str(s?.tekst),
    })),
    verwachtingen: arr(doc.verwachtingen).map((v) => tekstItem(v, 'vw-')).filter((v) => v.tekst),
    verhaal: arr(doc.verhaal).map((v, i) => {
      const t = tekstItem(v, 'vh-');
      return { id: typeof v === 'string' || !v?.id ? `vh-${i + 1}` : t.id, tekst: t.tekst };
    }).filter((v) => v.tekst),
    reviews: arr(doc.reviews).map((r) => ({
      id: ensureId(r?.id, 'rev'),
      naam: str(r?.naam),
      tekst: str(r?.tekst),
      datum: isoDate(r?.datum),
      afstand: str(r?.afstand),
      hidden: !!r?.hidden,
      uitgelicht: !!r?.uitgelicht,
    })),
    faq: arr(doc.faq).map((f) => ({ id: str(f?.id) || slug(f?.vraag, 'faq-'), vraag: str(f?.vraag), antwoord: str(f?.antwoord) })),
    media: arr(doc.media).map((m) => ({ id: ensureId(m?.id, 'm'), url: str(m?.url), alt: str(m?.alt) })),
    // Ids die de beheerder bewust verwijderde: mergeDefaults zet ze niet terug.
    verwijderdeIds: [...new Set(strList(doc.verwijderdeIds))],
  };
}

/* -------------------------------------------- standaardteksten samenvoegen */

/** Lijsten met id-items die mergeDefaults bijhoudt: pad in het document en hoe een item heet in het rapport. */
export const MERGE_LISTS = [
  { lijst: 'startpunten', pad: ['startpunten'], label: (x) => x.titel },
  { lijst: 'diensten', pad: ['diensten'], label: (x) => x.titel },
  { lijst: 'afstanden', pad: ['afstanden'], label: (x) => x.naam },
  { lijst: 'usps', pad: ['usps'], label: (x) => x.titel },
  { lijst: 'resultaten', pad: ['resultaten'], label: (x) => x.label },
  { lijst: 'wedstrijden', pad: ['wedstrijden'], label: (x) => `${x.naam} ${x.datum.slice(0, 4)}`.trim() },
  { lijst: 'werkwijze', pad: ['werkwijze'], label: (x) => x.titel },
  { lijst: 'verwachtingen', pad: ['verwachtingen'], label: (x) => x.tekst },
  { lijst: 'verhaal', pad: ['verhaal'], label: (x) => x.tekst.slice(0, 40) },
  { lijst: 'faq', pad: ['faq'], label: (x) => x.vraag },
  { lijst: 'reviews', pad: ['reviews'], label: (x) => x.naam },
];
const getPath = (obj, pad) => pad.reduce((o, k) => (o ? o[k] : undefined), obj);
const setPath = (obj, pad, value) => { const parent = pad.slice(0, -1).reduce((o, k) => o[k], obj); parent[pad[pad.length - 1]] = value; };
const leeg = (v) => v === '' || v === null || v === undefined;
/** Info-velden die mergeDefaults nooit invult: contactgegevens die in de standaarddata placeholders zijn. */
export const MERGE_SKIP_FIELDS = ['phone', 'whatsapp', 'email', 'kvk'];
/** Losse tekstvelden op het document die net als info-velden alleen leeg worden ingevuld. */
const MERGE_TEXT_FIELDS = ['prijsIntro', 'resultatenNoot', 'clubsTekst', 'clubsDisclaimer', 'voorbeeldVideoUrl', 'overKop', 'overIntro', 'zwemAchtergrond'];

/**
 * Voegt nieuwe standaardteksten uit het gebundelde data/site.json toe aan een
 * (genormaliseerd) document zonder de invullingen van de beheerder te overschrijven.
 * - Lijstitems: alleen ids die ontbreken worden toegevoegd (op de plek van bundled als
 *   de buurman ervoor bestaat, anders achteraan); bestaande items blijven ongewijzigd;
 *   ids in doc.verwijderdeIds komen niet terug.
 * - info-, hero- en tekstvelden: alleen lege velden worden gevuld; contactgegevens
 *   (placeholders in de standaarddata) worden nooit ingevuld.
 * Puur: geeft een nieuw document en een rapport terug.
 */
export function mergeDefaults(doc, bundled) {
  const out = JSON.parse(JSON.stringify(doc));
  const rapport = { toegevoegd: [], ingevuld: [], overgeslagen: [] };
  const verwijderd = new Set(out.verwijderdeIds || []);

  for (const { lijst, pad, label } of MERGE_LISTS) {
    const huidig = [...(getPath(out, pad) || [])];
    const standaard = getPath(bundled, pad) || [];
    const ids = () => new Set(huidig.map((x) => String(x.id)));
    standaard.forEach((item, i) => {
      const id = String(item.id);
      if (ids().has(id)) return;
      if (verwijderd.has(id)) { rapport.overgeslagen.push(id); return; }
      const kopie = JSON.parse(JSON.stringify(item));
      const buurman = i > 0 ? String(standaard[i - 1].id) : null;
      const plek = buurman ? huidig.findIndex((x) => String(x.id) === buurman) : -1;
      if (plek >= 0) huidig.splice(plek + 1, 0, kopie); else huidig.push(kopie);
      rapport.toegevoegd.push({ lijst, id, label: label(item) });
    });
    setPath(out, pad, huidig);
  }

  for (const [key, value] of Object.entries(bundled.info || {})) {
    if (MERGE_SKIP_FIELDS.includes(key) || Array.isArray(value) || (value && typeof value === 'object')) continue;
    if (leeg(out.info[key]) && !leeg(value)) { out.info[key] = value; rapport.ingevuld.push(key); }
  }
  for (const [key, value] of Object.entries(bundled.hero || {})) {
    if (leeg(out.hero[key]) && !leeg(value)) { out.hero[key] = value; rapport.ingevuld.push(`hero.${key}`); }
  }
  for (const key of MERGE_TEXT_FIELDS) {
    if (leeg(out[key]) && !leeg(bundled[key])) { out[key] = bundled[key]; rapport.ingevuld.push(key); }
  }
  return { doc: out, rapport };
}

/* ---------------------------------------------------------- afgeleiden */

/**
 * De enige plek die bepaalt wat de site te zien krijgt: verborgen diensten,
 * resultaten en ervaringen vallen weg, en ervaringen zonder tekst (de
 * placeholder voor Karl) ook. Alle renderers werken op het resultaat van deze
 * functie, nooit op het ruwe document.
 */
export function filter(doc) {
  return {
    ...doc,
    diensten: doc.diensten.filter((d) => !d.hidden),
    resultaten: doc.resultaten.filter((r) => !r.hidden),
    wedstrijden: doc.wedstrijden.filter((w) => !w.hidden),
    reviews: doc.reviews.filter((r) => !r.hidden && r.tekst.trim() && r.naam.trim()),
  };
}

/** Zichtbare wedstrijden per categorie, in de vaste volgorde; lege categorieën vallen weg. */
export function wedstrijdenPerCategorie(doc) {
  const zichtbaar = filter(doc).wedstrijden;
  return WEDSTRIJD_CATEGORIEEN
    .map(([id, label]) => ({ id, label, items: zichtbaar.filter((w) => w.categorie === id) }))
    .filter((g) => g.items.length);
}

/** Korte maand + jaar: "sep 2025". */
export function formatMaandKort(iso) {
  if (!/^\d{4}-\d{2}/.test(iso || '')) return iso || '';
  const [y, m] = iso.split('-').map(Number);
  return `${['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][m - 1]} ${y}`;
}

/** Zichtbare ervaringen, nieuwste eerst. */
export function visibleReviews(doc) {
  return filter(doc).reviews.slice().sort((a, b) => b.datum.localeCompare(a.datum));
}

/** Uitgelichte ervaringen voor de homepage; zonder vinkjes de nieuwste. */
export function featuredReviews(doc, max = 3) {
  const list = visibleReviews(doc);
  const uit = list.filter((r) => r.uitgelicht);
  return (uit.length ? uit : list).slice(0, max);
}

/** Vandaag als YYYY-MM-DD in de tijdzone van de bezoeker. */
export function todayIso(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** Datum als "zaterdag 10 juli 2026"; "2026-04" wordt "april 2026". */
export function formatDatum(iso, opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
  if (/^\d{4}-\d{2}$/.test(iso || '')) {
    const [y, m] = iso.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  }
  if (!isoDate(iso)) return iso || '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('nl-NL', opts);
}

/** Maand + jaar: "april 2026". */
export const formatMaand = (iso) => formatDatum(iso, { month: 'long', year: 'numeric' });
