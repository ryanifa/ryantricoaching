/* Gestructureerde gegevens (schema.org JSON-LD) voor alle pagina's, uit één functie
   zodat elke pagina hetzelfde @graph deelt: Person (Ryan), SportsActivityLocation
   (het bedrijf), WebSite, een Service per dienst (met Offer als er een prijs is),
   de WebPage zelf, BreadcrumbList op subpagina's en FAQPage waar een eigen FAQ staat.
   tools/build.py bakt dezelfde structuur in de HTML (uit data/site.json); site.js
   vervangt die zodra de live gegevens (telefoon, e-mail, sameAs, prijzen, FAQ) binnen zijn. */

import { faqVoor, socialLinks } from './store.js?v=2026.10.31-1';

export const SITE = 'https://ryantricoaching.nl';
const ID = { ryan: `${SITE}/#ryan`, business: `${SITE}/#business`, website: `${SITE}/#website` };
const AREA = ['Rotterdam', 'Zuid-Holland', 'Nederland (online)'];
const ADDRESS = { '@type': 'PostalAddress', addressLocality: 'Rotterdam', addressRegion: 'Zuid-Holland', addressCountry: 'NL' };

/** Namen in het kruimelpad en de pagina's die onder "Diensten" vallen. */
export const PAGE_NAMES = {
  diensten: 'Diensten', zwemanalyse: 'Zwemanalyse', race: 'Begeleiding naar je race', werkwijze: 'Werkwijze',
  over: 'Over Ryan', ervaringen: 'Ervaringen', contact: 'Contact', privacy: 'Privacy', voorwaarden: 'Voorwaarden', bedankt: 'Bedankt',
};
const ONDER_DIENSTEN = ['zwemanalyse', 'race'];
/** Pagina's met een eigen FAQ-lijst (en dus een FAQPage). */
export const FAQ_PAGES = ['home', 'diensten', 'zwemanalyse'];
const SERVICE_TYPES = { zwemanalyse: 'Zwemanalyse met onderwatervideo', schemas: 'Trainingsschema fietsen en lopen', race: 'Triathlon-coaching: begeleiding naar je race' };

const isRealPhone = (p) => /\d{9,}/.test(String(p || '').replace(/\D/g, '')) && !/x/i.test(p);
const isRealEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e || '') && !/voorbeeld\.nl$/i.test(e);
const isUrl = (u) => /^https?:\/\//i.test(u || '');

/** Telefoonnummer internationaal: "06-12345678" → "+31612345678". */
export function telInternational(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `31${d.slice(1)}`;
  return `+${d}`;
}

export const dienstUrl = (d) => `${SITE}/${d.id === 'zwemanalyse' ? 'zwemanalyse.html' : d.id === 'race' ? 'race.html' : `diensten.html#${d.id}`}`;

function priceRange(diensten) {
  const prijzen = diensten.map((d) => d.prijs).filter((p) => typeof p === 'number' && p > 0);
  if (!prijzen.length) return 'Op aanvraag';
  const min = Math.min(...prijzen); const max = Math.max(...prijzen);
  return min === max ? `€${min}` : `€${min}–€${max}`;
}

/**
 * Bouwt het @graph voor één pagina.
 * doc: het gefilterde document (filter(doc) uit store.js); page: data-page van de body;
 * title/description/url: wat in de <head> staat.
 */
export function buildSchema(doc, { page = 'home', title = '', description = '', url = `${SITE}/` } = {}) {
  const info = doc.info;
  const sameAs = [...socialLinks(info).map((l) => l.href), info.tvs90, info.cs010].filter(isUrl);
  const diensten = doc.diensten.filter((d) => d.titel);

  const person = {
    '@type': 'Person', '@id': ID.ryan, name: 'Ryan Douglas', jobTitle: 'Triathlon-coach',
    url: `${SITE}/over.html`, image: `${SITE}/assets/img/ryan.jpg`,
    address: { '@type': 'PostalAddress', addressLocality: 'Rotterdam', addressCountry: 'NL' },
    worksFor: { '@id': ID.business },
    memberOf: [
      { '@type': 'SportsTeam', name: "TVS'90", sport: 'Triathlon', ...(isUrl(info.tvs90) ? { url: info.tvs90 } : {}) },
      { '@type': 'SportsTeam', name: 'CS010', sport: 'Wielrennen', ...(isUrl(info.cs010) ? { url: info.cs010 } : {}) },
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
  const business = {
    '@type': 'SportsActivityLocation', '@id': ID.business, name: info.name || 'Ryan Triathlon Coaching', url: `${SITE}/`,
    image: `${SITE}/assets/og.png`, logo: `${SITE}/assets/logo/icon-512.png`,
    description: doc.hero.sub,
    ...(isRealPhone(info.phone || info.whatsapp) ? { telephone: telInternational(info.phone || info.whatsapp) } : {}),
    ...(isRealEmail(info.email) ? { email: info.email } : {}),
    address: ADDRESS, areaServed: AREA, priceRange: priceRange(diensten),
    founder: { '@id': ID.ryan }, employee: { '@id': ID.ryan },
    ...(sameAs.length ? { sameAs } : {}),
  };
  const website = { '@type': 'WebSite', '@id': ID.website, name: info.name || 'Ryan Triathlon Coaching', url: `${SITE}/`, inLanguage: 'nl-NL', publisher: { '@id': ID.business } };
  const services = diensten.map((d) => ({
    '@type': 'Service', '@id': `${SITE}/#service-${d.id}`, name: d.titel, serviceType: SERVICE_TYPES[d.id] || d.titel,
    description: d.kort, provider: { '@id': ID.business }, areaServed: AREA, url: dienstUrl(d),
    ...(typeof d.prijs === 'number' && d.prijs > 0 ? { offers: { '@type': 'Offer', price: d.prijs, priceCurrency: 'EUR', url: dienstUrl(d), availability: 'https://schema.org/InStock' } } : {}),
  }));
  const webpage = {
    '@type': 'WebPage', '@id': `${url}#webpage`, url, name: title, description, inLanguage: 'nl-NL',
    isPartOf: { '@id': ID.website }, about: { '@id': ID.business }, primaryImageOfPage: `${SITE}/assets/og.png`,
  };
  const graph = [person, business, website, ...services, webpage];

  if (page !== 'home' && PAGE_NAMES[page]) {
    const items = [{ name: 'Home', item: `${SITE}/` }];
    if (ONDER_DIENSTEN.includes(page)) items.push({ name: PAGE_NAMES.diensten, item: `${SITE}/diensten.html` });
    items.push({ name: PAGE_NAMES[page], item: url });
    graph.push({
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })),
    });
  }
  if (FAQ_PAGES.includes(page)) {
    const faq = faqVoor(doc, page);
    if (faq.length) {
      graph.push({
        '@type': 'FAQPage', '@id': `${url}#faq`,
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.vraag, acceptedAnswer: { '@type': 'Answer', text: f.antwoord } })),
      });
    }
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
