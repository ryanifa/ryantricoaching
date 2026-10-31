/* Tests voor normalize(), filter() en mergeDefaults() in assets/js/store.js. Draaien met: node tests/merge.test.js */
import assert from 'node:assert/strict';
import { normalize, mergeDefaults, filter, featuredReviews, slug, formatDatum, formatMaandKort, wedstrijdenPerCategorie, faqVoor, plaatsenLijst, socialLinks } from '../assets/js/store.js';

const bundled = normalize({
  info: { tagline: 'Standaard tagline', regio: 'Rotterdam', strava: 'https://www.strava.com/athletes/1' },
  hero: { kop: 'Standaard kop', sub: 'Standaard sub', ctaPrimair: 'Plan een kennismaking' },
  prijsIntro: 'Op aanvraag.',
  diensten: [{ id: 'zwemanalyse', titel: 'Zwemanalyse', kort: 'a' }, { id: 'schemas', titel: 'Schema\'s', kort: 'b' }, { id: 'race', titel: 'Race', kort: 'c' }],
  afstanden: [{ naam: '1/8 triathlon', zwem: '500 m' }, { naam: '1/4 triathlon', zwem: '1000 m' }],
  usps: [{ titel: 'Ik doe het zelf', tekst: 'x' }, { titel: 'Technisch onderlegd', tekst: 'y' }],
  werkwijze: [{ titel: 'Kennismaking', tekst: 'a' }, { titel: 'Intake en data', tekst: 'b' }],
  verwachtingen: ['Eerlijk zijn', 'Data delen'],
  verhaal: ['Alinea één', 'Alinea twee', 'Alinea drie'],
  faq: [{ vraag: 'Moet ik al kunnen zwemmen?', antwoord: 'Een beetje.' }, { vraag: 'Wat kost het?', antwoord: 'Op aanvraag.' }],
});

// Het "live" document van de beheerder: oudere versie met eigen invullingen.
const live = normalize({
  info: { tagline: 'Eigen tagline!', regio: '', strava: '', phone: '06-11111111' },
  hero: { kop: 'Eigen kop', sub: '' },
  prijsIntro: '',
  diensten: [{ id: 'zwemanalyse', titel: 'Zwemanalyse (eigen titel)', kort: 'eigen' }],
  afstanden: [{ id: 'afst-1-8-triathlon', naam: '1/8 triathlon', zwem: '400 m' }],
  usps: [{ id: 'usp-ik-doe-het-zelf', titel: 'Ik doe het zelf', tekst: 'eigen tekst' }],
  werkwijze: [{ id: 'ww-kennismaking', titel: 'Kennismaking', tekst: 'eigen' }],
  verwachtingen: ['Eerlijk zijn'],
  verhaal: [{ id: 'vh-1', tekst: 'Eigen alinea' }],
  faq: [{ id: 'faq-moet-ik-al-kunnen-zwemmen', vraag: 'Moet ik al kunnen zwemmen?', antwoord: 'Eigen antwoord.' }],
  verwijderdeIds: ['vw-data-delen', 'ww-intake-en-data'],
});

let n = 0;
const test = (naam, fn) => { fn(); n++; console.log('✓', naam); };

test('normalize geeft lijsten zonder id een stabiele slug-id', () => {
  assert.equal(bundled.faq[1].id, 'faq-wat-kost-het');
  assert.equal(bundled.afstanden[0].id, 'afst-1-8-triathlon');
  assert.equal(bundled.usps[1].id, 'usp-technisch-onderlegd');
  assert.equal(bundled.werkwijze[1].id, 'ww-intake-en-data');
  assert.equal(bundled.verwachtingen[1].id, 'vw-data-delen');
  assert.deepEqual(bundled.verhaal.map((v) => v.id), ['vh-1', 'vh-2', 'vh-3']);
  assert.equal(slug('Zwemmen & Fietsen in Rotterdam', 'x-'), 'x-zwemmen-fietsen-in-rotterdam');
});

test('normalize vult stapnummers, iconen en standaardwaarden', () => {
  assert.deepEqual(bundled.werkwijze.map((w) => w.stap), [1, 2]);
  assert.equal(bundled.diensten[0].icon, 'loop');
  assert.equal(bundled.diensten[0].prijsTekst, 'Op aanvraag');
  assert.equal(normalize({}).info.name, 'Ryan Triathlon Coaching');
  assert.equal(normalize({ hero: 'oude string' }).hero.kop, '');
  assert.equal(normalize({ resultaten: [{ label: 'Marathon', waarde: '3:30', datum: '2026-04' }] }).resultaten[0].datum, '2026-04');
  assert.equal(normalize({ resultaten: [{ label: 'x', datum: 'april' }] }).resultaten[0].datum, '');
});

const voor = JSON.stringify(live);
const { doc, rapport } = mergeDefaults(live, bundled);

test('de functie is puur: het invoerdocument verandert niet', () => {
  assert.equal(JSON.stringify(live), voor);
});

test('nieuw item wordt toegevoegd (dienst, afstand, usp, FAQ, verhaal)', () => {
  assert.deepEqual(doc.diensten.map((d) => d.id), ['zwemanalyse', 'schemas', 'race']);
  assert.ok(doc.afstanden.some((a) => a.id === 'afst-1-4-triathlon'));
  assert.ok(doc.usps.some((u) => u.id === 'usp-technisch-onderlegd'));
  assert.ok(doc.faq.some((f) => f.id === 'faq-wat-kost-het'));
  assert.deepEqual(doc.verhaal.map((v) => v.id), ['vh-1', 'vh-2', 'vh-3']);
  const ids = rapport.toegevoegd.map((t) => `${t.lijst}:${t.id}`);
  assert.deepEqual(ids.sort(), ['afstanden:afst-1-4-triathlon', 'diensten:race', 'diensten:schemas', 'faq:faq-wat-kost-het', 'usps:usp-technisch-onderlegd', 'verhaal:vh-2', 'verhaal:vh-3'].sort());
  assert.equal(rapport.toegevoegd.find((t) => t.id === 'schemas').label, 'Schema\'s');
});

test('bestaand item met andere tekst in bundled blijft byte-voor-byte ongewijzigd', () => {
  assert.equal(doc.diensten[0].titel, 'Zwemanalyse (eigen titel)');
  assert.equal(doc.afstanden[0].zwem, '400 m');
  assert.equal(doc.faq[0].antwoord, 'Eigen antwoord.');
  assert.equal(doc.werkwijze[0].tekst, 'eigen');
  assert.equal(doc.verhaal[0].tekst, 'Eigen alinea');
});

test('verwijderd item komt niet terug en staat in overgeslagen', () => {
  assert.ok(!doc.verwachtingen.some((v) => v.id === 'vw-data-delen'));
  assert.ok(!doc.werkwijze.some((w) => w.id === 'ww-intake-en-data'));
  assert.deepEqual(rapport.overgeslagen.sort(), ['vw-data-delen', 'ww-intake-en-data']);
  assert.deepEqual(doc.verwijderdeIds, ['vw-data-delen', 'ww-intake-en-data']);
});

test('leeg info-, hero- en tekstveld wordt gevuld, gevuld veld niet', () => {
  assert.equal(doc.info.regio, 'Rotterdam');
  assert.equal(doc.info.strava, 'https://www.strava.com/athletes/1');
  assert.equal(doc.info.tagline, 'Eigen tagline!');
  assert.equal(doc.hero.kop, 'Eigen kop');
  assert.equal(doc.hero.sub, 'Standaard sub');
  assert.equal(doc.hero.ctaPrimair, 'Plan een kennismaking');
  assert.equal(doc.prijsIntro, 'Op aanvraag.');
  assert.deepEqual(rapport.ingevuld.sort(), ['hero.ctaPrimair', 'hero.sub', 'prijsIntro', 'regio', 'strava'].sort());
});

test('contactvelden (placeholders) worden nooit ingevuld', () => {
  const b = normalize({ info: { phone: '06-xxxxxxxx', whatsapp: '06-xxxxxxxx', email: 'mail@voorbeeld.nl', kvk: '00000000', tagline: 'x' } });
  const l = normalize({ info: { phone: '06-11111111', whatsapp: '', email: '', kvk: '', tagline: '' } });
  const r = mergeDefaults(l, b);
  assert.equal(r.doc.info.whatsapp, '');
  assert.equal(r.doc.info.email, '');
  assert.equal(r.doc.info.kvk, '');
  assert.equal(r.doc.info.phone, '06-11111111');
  assert.deepEqual(r.rapport.ingevuld, ['tagline']);
});

test('nogmaals samenvoegen levert niets nieuws op', () => {
  const tweede = mergeDefaults(doc, bundled);
  assert.equal(tweede.rapport.toegevoegd.length, 0);
  assert.equal(tweede.rapport.ingevuld.length, 0);
  assert.equal(JSON.stringify(tweede.doc), JSON.stringify(doc));
});

test('positie: nieuw item komt na zijn buurman uit bundled', () => {
  const b = normalize({ faq: [{ id: 'a', vraag: 'A' }, { id: 'b', vraag: 'B' }, { id: 'c', vraag: 'C' }] });
  const l = normalize({ faq: [{ id: 'c', vraag: 'C' }, { id: 'a', vraag: 'A' }] });
  assert.deepEqual(mergeDefaults(l, b).doc.faq.map((o) => o.id), ['c', 'a', 'b']);
});

test('filter verbergt lege en verborgen ervaringen en verborgen diensten', () => {
  const d = normalize({
    diensten: [{ id: 'a', titel: 'A' }, { id: 'b', titel: 'B', hidden: true }],
    reviews: [
      { id: 'r1', naam: 'Karl', tekst: '', hidden: true },
      { id: 'r2', naam: 'Anna', tekst: 'Top', datum: '2026-09-01' },
      { id: 'r3', naam: 'Bob', tekst: 'Fijn', datum: '2026-10-01', uitgelicht: true },
      { id: 'r4', naam: '', tekst: 'Anoniem', datum: '2026-10-02' },
    ],
  });
  const f = filter(d);
  assert.deepEqual(f.diensten.map((x) => x.id), ['a']);
  assert.deepEqual(f.reviews.map((x) => x.id), ['r2', 'r3']);
  assert.deepEqual(featuredReviews(d).map((x) => x.id), ['r3']);
});

test('FAQ per pagina: normalize, faqVoor en samenvoegen', () => {
  const b = normalize({ faq: [
    { id: 'a', vraag: 'Algemeen?', antwoord: 'Ja.' },
    { id: 'h', vraag: 'Home?', antwoord: 'Ja.', pagina: 'home' },
    { id: 'z', vraag: 'Zwem?', antwoord: 'Ja.', pagina: 'zwemanalyse' },
    { id: 'x', vraag: 'Onbekend?', antwoord: 'Ja.', pagina: 'bestaat-niet' },
    { id: 'leeg', vraag: 'Zonder antwoord?', antwoord: '', pagina: 'home' },
  ] });
  assert.deepEqual(b.faq.map((f) => f.pagina), ['algemeen', 'home', 'zwemanalyse', 'algemeen', 'home']);
  assert.deepEqual(faqVoor(b, 'home').map((f) => f.id), ['h']);
  assert.deepEqual(faqVoor(b).map((f) => f.id), ['a', 'x']);
  const l = normalize({ faq: [{ id: 'a', vraag: 'Eigen algemeen?', antwoord: 'Eigen.' }] });
  const r = mergeDefaults(l, b);
  assert.deepEqual(r.doc.faq.map((f) => `${f.id}:${f.pagina}`), ['a:algemeen', 'h:home', 'z:zwemanalyse', 'x:algemeen', 'leeg:home']);
  assert.equal(r.doc.faq[0].vraag, 'Eigen algemeen?');
});

test('nieuw veld op een bestaande dienst (intro) wordt alleen leeg ingevuld; prijs is een getal of null', () => {
  const b = normalize({ diensten: [{ id: 'zwemanalyse', titel: 'Zwemanalyse', intro: 'Zwemanalyse in Rotterdam.', prijs: '95' }, { id: 'race', titel: 'Race', intro: 'Race-intro.' }] });
  assert.equal(b.diensten[0].prijs, 95);
  assert.equal(b.diensten[1].prijs, null);
  assert.equal(normalize({ diensten: [{ id: 'a', titel: 'A', prijs: 'geen' }] }).diensten[0].prijs, null);
  assert.equal(normalize({ diensten: [{ id: 'a', titel: 'A', prijs: 0 }] }).diensten[0].prijs, null);
  const l = normalize({ diensten: [{ id: 'zwemanalyse', titel: 'Eigen', intro: '' }, { id: 'race', titel: 'Race', intro: 'Eigen intro.' }] });
  const { doc: d, rapport: r } = mergeDefaults(l, b);
  assert.equal(d.diensten[0].intro, 'Zwemanalyse in Rotterdam.');
  assert.equal(d.diensten[0].titel, 'Eigen');
  assert.equal(d.diensten[0].prijs, null, 'prijs wordt niet uit bundled overgenomen');
  assert.equal(d.diensten[1].intro, 'Eigen intro.');
  assert.deepEqual(r.ingevuld, ['diensten.zwemanalyse.intro']);
  assert.equal(mergeDefaults(d, b).rapport.ingevuld.length, 0);
});

test('info: plaatsen, clubpagina\'s en sociale links', () => {
  const d = normalize({ info: { plaatsen: 'Rotterdam, Schiedam ;Vlaardingen,, ', tvs90: 'https://tvs90.nl/', instagram: '@ryan', strava: '123', linkedin: 'in/ryan-d' } });
  assert.deepEqual(plaatsenLijst(d.info), ['Rotterdam', 'Schiedam', 'Vlaardingen']);
  assert.equal(d.info.tvs90, 'https://tvs90.nl/');
  assert.equal(d.info.cs010, '');
  assert.deepEqual(socialLinks(d.info).map((l) => l.href), ['https://www.instagram.com/ryan/', 'https://www.strava.com/athletes/123', 'https://www.linkedin.com/in/ryan-d/']);
  const b = normalize({ info: { plaatsen: 'Rotterdam', zwemLocatie: 'x' }, zwemLocatie: 'zwembad X' });
  const r = mergeDefaults(normalize({}), b);
  assert.equal(r.doc.info.plaatsen, 'Rotterdam');
  assert.equal(r.doc.zwemLocatie, 'zwembad X');
});

test('wedstrijden: normalize, samenvoegen en verborgen filteren', () => {
  const b = normalize({ wedstrijden: [
    { id: 'w-hele-20250913', datum: '2025-09-13', naam: 'Almere', categorie: 'hele', tijd: '12:17:28' },
    { id: 'w-kwart-20260913', datum: '2026-09-13', naam: 'Rotterdam', categorie: 'kwart', tijd: '2:32:00' },
    { datum: '2019-06-08', naam: 'Brasseuse', categorie: 'onzin', tijd: '4:34:11' },
  ] });
  assert.equal(b.wedstrijden[2].id, 'w-overig-tri-20190608');
  assert.equal(b.wedstrijden[2].categorie, 'overig-tri');
  assert.equal(normalize({ wedstrijden: [{ naam: 'x', datum: 'ooit' }] }).wedstrijden[0].datum, '');

  const l = normalize({ wedstrijden: [{ id: 'w-hele-20250913', datum: '2025-09-13', naam: 'Almere (eigen)', categorie: 'hele', tijd: '12:17:00', hidden: true }], verwijderdeIds: ['w-overig-tri-20190608'] });
  const r = mergeDefaults(l, b);
  assert.deepEqual(r.doc.wedstrijden.map((w) => w.id), ['w-hele-20250913', 'w-kwart-20260913']);
  assert.equal(r.doc.wedstrijden[0].naam, 'Almere (eigen)');
  assert.deepEqual(r.rapport.toegevoegd.map((t) => `${t.lijst}:${t.label}`), ['wedstrijden:Rotterdam 2026']);
  assert.deepEqual(r.rapport.overgeslagen, ['w-overig-tri-20190608']);

  assert.deepEqual(filter(r.doc).wedstrijden.map((w) => w.id), ['w-kwart-20260913']);
  assert.deepEqual(wedstrijdenPerCategorie(r.doc).map((g) => [g.id, g.items.length]), [['kwart', 1]]);
  assert.deepEqual(wedstrijdenPerCategorie(b).map((g) => g.id), ['hele', 'kwart', 'overig-tri']);
  assert.equal(formatMaandKort('2025-09-13'), 'sep 2025');
  assert.equal(formatMaandKort('2026-03'), 'mrt 2026');
});

test('formatDatum begrijpt jaar-maand', () => {
  assert.equal(formatDatum('2026-04'), 'april 2026');
  assert.equal(formatDatum(''), '');
});

console.log(`\n${n} tests geslaagd`);
