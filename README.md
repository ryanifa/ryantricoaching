# Ryan Triathlon Coaching

Website van Ryan Douglas, triathlon-coach uit Rotterdam: zwemanalyse,
trainingsschema's en begeleiding naar je 1/8, 1/4, 1/2 of hele triathlon.
Bezoekers zien een snelle, lichte, mobielvriendelijke site; Ryan past
ervaringen, diensten, resultaten, zijn verhaal en contactgegevens zelf aan via
`beheer.html`.

Geen server, geen build-stap, geen dependencies: statische bestanden op GitHub
Pages, en de gegevens staan als één JSON-bestand in een **Gist** (de "database").
De opzet is overgenomen van `ryanifa/djroggy`.

Specificatie: **`SPEC-ryantricoaching.md`** (versie 1.1). Werkafspraken voor wie aan de code werkt: `CLAUDE.md`.

## Hoe het werkt

| | |
|---|---|
| Hosting | GitHub Pages (deze repo, vanuit `main`), eigen domein **ryantricoaching.nl** via `CNAME` |
| Gegevens | `site.json` in een openbare Gist |
| Lezen (bezoekers) | Zonder sleutel, rechtstreeks van de GitHub-API |
| Schrijven (beheer) | Met een GitHub-sleutel die alleen Gists mag |
| Terugval | `data/site.json` in de repo, plus een cache in de browser |
| Contactformulier | Formspree (`formspreeId: 'mnppdepj'` in `assets/js/config.js`); berichten komen per e-mail binnen, bezoeker landt op `bedankt.html`. Het id staat ook in de HTML gebakken, dus het werkt zonder JavaScript. Verplicht: naam, e-mail, akkoord-vinkje; honeypot tegen spam. Alternatief: dezelfde tekst als WhatsApp-bericht naar `info.whatsapp` |
| Statistieken | GoatCounter (`goatcounter: 'ryantricoaching'`), dashboard https://ryantricoaching.goatcounter.com. Cookieloos, dus geen banner; telt niet op localhost |
| Doorverwijzing | `ryantricoaching.com` → `.nl` via de repo `ryanifa/ryantricoaching-com` (alleen `CNAME`, `index.html`, `404.html`) |

De GitHub-API staat zonder sleutel 60 verzoeken per uur per IP-adres toe. Is dat
op, dan valt de site terug op de CDN-kopie van de Gist
(`gist.githubusercontent.com`), die geen limiet heeft maar een paar minuten
achter kan lopen. Daarvoor is `gistOwner` in `config.js` nodig.

Bezoekers zien meteen inhoud (de HTML bevat de standaardinhoud, daarna de cache
of `data/site.json`) en vervolgens, zodra de Gist binnen is, de actuele versie.
Is GitHub even niet bereikbaar, dan blijft de site gewoon werken.

## Live

| | |
|---|---|
| Website | https://ryantricoaching.nl/ |
| Beheer | https://ryantricoaching.nl/beheer.html |
| Gegevens | Gist `1122dca5b56fd7e3917480003f536035` (eigenaar `ryanifa`); zie `config.js` |
| Formulier | Formspree-dashboard: https://formspree.io (formulier `mnppdepj`) |
| Statistieken | https://ryantricoaching.goatcounter.com |
| DNS | Hostnet: vier A-records en AAAA naar GitHub Pages, `www` CNAME naar `ryanifa.github.io`; zelfde voor `.com` |

## Eenmalig instellen

1. **Maak een sleutel.** Ga naar
   [GitHub → fine-grained token](https://github.com/settings/personal-access-tokens/new)
   en zet bij **Account permissions → Gists** de waarde op **Read and write**.
   Verder niets aanzetten.
2. **Open `beheer.html`** op de site, plak de sleutel en klik op *Inloggen*.
3. Klik op **Nieuwe Gist aanmaken**. De Gist wordt gevuld met `data/site.json`.
4. **Zet het Gist-id en je GitHub-naam in `assets/js/config.js`** (het tabblad
   *Instellingen* laat de exacte regels zien) en push. Vanaf dan zien álle
   bezoekers de live gegevens.
5. **Formulier:** maak op [formspree.io](https://formspree.io) een formulier aan
   en zet het id in `config.js` (`formspreeId`). Gedaan (28-10-2026). Tip: in
   Formspree → Settings → *Restrict to domain* `ryantricoaching.nl` zetten.
5b. **Statistieken:** maak op [goatcounter.com](https://www.goatcounter.com) een
   account aan en zet de code in `config.js` (`goatcounter`). Gedaan (28-10-2026).
6. **Telefoonnummer:** vul in beheer → Info het WhatsApp-nummer in en publiceer.
   Tot die tijd wijzen alle WhatsApp-knoppen naar het formulier.
7. **Foto's:** `assets/img/ryan.jpg` (hero, homepage), `assets/img/ryan-loop.jpg`
   (verhaalblok en Over Ryan), `assets/img/analyse/*.jpg` (onderwaterbeelden),
   `assets/img/sensor/*.jpg` (sensorschermen), `assets/video/analyse-poster.jpg`
   (startbeeld van de voorbeeldvideo). Allemaal gedaan.
8. **DNS:** `ryantricoaching.nl` als CNAME/A-records naar GitHub Pages; `CNAME`
   in de repo staat al klaar.

Eerst rondkijken kan ook: *Demo zonder sleutel* op de inlogpagina. Wijzigingen
blijven dan in je browser, en de website laat ze (alleen in die browser) zien
met een gele balk erboven.

## Beheren (tabs in `beheer.html`)

- **Ervaringen** — ervaringen van atleten: naam, afstand, datum, tekst,
  *uitgelicht* (homepage) en *verbergen*. Een ervaring zonder tekst blijft
  automatisch verborgen (de placeholder voor Karl staat al klaar).
- **Diensten** — de drie diensten (tekst, intro-zin met zoekterm, voor wie, wat je
  krijgt, prijstekst, prijs in euro alleen voor Google),
  de prijstekst, de afstanden op de racepagina, de drie "Waar sta je?"-kaarten,
  de **voorbeeldvideo** (directe mp4-link uit de eoSwimming-Worker; let op de
  vervaldatum `e=` in de link, nu 27-10-2027) en de **zwemachtergrond**
  (KNZB-opleiding, De Waterman) op de zwemanalysepagina.
- **Resultaten** — het cijferblok (label, waarde, maand), de noot eronder, de
  drie punten "Waarom Ryan" en de **wedstrijdenlijst** (datum, naam, categorie
  hele/halve/kwart/achtste/overig/marathon/ultra, tijd). Een naam met "(DNF)"
  telt niet mee in het aantal per categorie. Bron: Garmin Connect, multisport
  en hardlopen ≥ 42 km.
- **Verhaal & FAQ** — kop en intro van "Over Ryan", alinea's van "Mijn
  verhaal", clubs en achtergrond, de werkwijze-stappen, "Wat ik van jou
  verwacht" en de veelgestelde vragen. Elke vraag heeft een pagina: de gedeelde
  lijst (werkwijze, race, contact), homepage, diensten of zwemanalyse; de
  laatste drie gaan ook als FAQ-schema naar Google.
- **Info** — kop en knoppen op de homepage, mededeling, naam, tagline, regio,
  plaatsen (homepage "Voor wie uit Rotterdam en omgeving"), WhatsApp, telefoon,
  e-mail, KvK, Instagram, Strava, Facebook, LinkedIn en de clubpagina's van
  TVS'90 en CS010 (alleen voor Google, als `sameAs`).
- **Instellingen** — Gist-gegevens, back-up downloaden/terugzetten, nieuwe
  standaardteksten samenvoegen, terug naar standaarddata, beheerlink voor op de
  telefoon.

Wijzigingen staan eerst als concept klaar (ook na herladen). Pas met
**Publiceren** komen ze op de website. Heeft iemand anders intussen op een ander
apparaat gepubliceerd, dan vraagt de app eerst of je dat wilt overschrijven.

### Over de sleutel

De sleutel blijft in de browser van de beheerder (localStorage) en gaat alleen
naar `api.github.com`. Wie de sleutel heeft, kan bij de Gists van dat account —
gebruik dus een sleutel die alléén Gists mag. Lekt hij uit: intrekken bij GitHub,
nieuwe maken, opnieuw inloggen. De Gist blijft gewoon bestaan.

## Bestanden

```
index.html              de homepage
diensten.html           drie diensten uitgebreid, prijzen op aanvraag
zwemanalyse.html        landingspagina zwemanalyse
race.html               begeleiding naar je race: afstanden en voorbeeldtijdlijn
werkwijze.html, over.html, ervaringen.html, contact.html
privacy.html, voorwaarden.html, bedankt.html, 404.html
sitemap.xml, robots.txt, manifest.webmanifest, CNAME, .nojekyll
beheer.html             het beheer (zes tabs, concept/publiceren, demo)
data/site.json          standaarddata en terugval (alles wat in beheer te wijzigen is)
assets/js/config.js     Gist-id, Gist-eigenaar, Formspree-id, GoatCounter-code
assets/js/gist.js       de enige plek die met de GitHub-API praat
assets/js/store.js      laden, cache, demo en het datamodel (normalize, filter, mergeDefaults)
assets/js/site.js       de website opbouwen
assets/js/schema.js     gestructureerde gegevens (schema.org JSON-LD) uit het databestand; build.py bakt dezelfde opbouw in de HTML
assets/js/admin.js      het beheer
assets/js/media.js      foto's verkleinen en uploaden (nog niet gebruikt in v1)
assets/js/dom.js        kleine DOM-hulpjes (alles via textContent)
assets/css/             base.css (tokens, gedeeld), site.css, admin.css
assets/logo/            logo.svg, logo-mark.svg, logo-wit.svg, icon.svg, PNG-iconen, alt-1/alt-2 (alternatieve beeldmerken)
assets/img/             ryan.jpg (hero), ryan-loop.jpg, analyse/ (stills), sensor/ (schermen)
assets/video/           analyse-poster.jpg; de video zelf staat in de eoSwimming-Worker (link in beheer)
assets/og.png           Open Graph-afbeelding (1200×630)
qr/                     QR-code naar de site
tools/build.py          genereert de HTML-pagina's uit data/site.json
tools/logos.py          genereert de logo-SVG's en PNG-iconen
tools/og.py             genereert assets/og.png
tests/merge.test.js     tests voor normalize/filter/mergeDefaults/wedstrijden
```

Lokaal bekijken: `python3 -m http.server` in de repo en open
`http://localhost:8000`.

Elke pagina bevat de standaardinhoud al in de HTML (uit `data/site.json`),
zodat de site ook zonder JavaScript en zonder GitHub werkt; `site.js` vervangt
die inhoud zodra de actuele gegevens binnen zijn. De pagina's worden
gegenereerd met `python3 tools/build.py`; verander je vaste teksten in
`data/site.json` of het nummer in `VERSION`, draai dat script dan opnieuw.

## Logo

Beeldmerk: fietswiel met hoge velg en vijf spaken (donkergroen), rode
hardloopschoen en twee groene golven. Woordmerk "Ryan **TC**" (TC in rood)
met "TRIATHLON COACHING" eronder; tagline "Sneller door slimmer te trainen".
`logo.svg` is de standaard, `logo-mark.svg` alleen het beeldmerk, `logo-wit.svg`
voor donkere ondergrond, `icon.svg` het favicon op groene tegel. `alt-1.svg` en
`alt-2.svg` zijn afgevallen varianten. Alles komt uit `tools/logos.py`; de
OG-afbeelding (met tagline) uit `tools/og.py`.

## Nieuwe standaardteksten na een update

`data/site.json` is de standaarddata. Na een update van de site kunnen daar
nieuwe teksten in staan (een FAQ-vraag, een afstand, een nieuw Info-veld). Die
komen niet vanzelf in de live Gist. Twee knoppen in beheer → Instellingen:

- **Nieuwe standaardteksten samenvoegen** — gebruik dit na een update. Voegt
  alleen toe wat nog ontbreekt en vult lege velden; wat Ryan zelf invulde of
  verwijderde blijft zoals het is. Eerst een overzicht, dan Toepassen, dan
  Publiceren. Bij het openen van beheer kijkt de app één keer per sessie of er
  iets nieuws is en toont dan een balk.
- **Standaardgegevens** — alleen om helemaal opnieuw te beginnen: vervangt
  álles. Vraagt twee keer om bevestiging.

Technisch: `mergeDefaults(doc, bundled)` in `store.js` (puur, met rapport).
Lijstitems worden herkend aan hun `id`; lijsten zonder id krijgen in
`normalize()` een stabiele id uit een slug van de tekst. Verwijderde items
staan in `doc.verwijderdeIds` en komen niet terug. Tests: `node tests/merge.test.js`.

## Versie en verversen

`VERSION` bevat het versienummer (datum + volgnummer). Het staat in de footer
van elke pagina en achter de CSS/JS-links. Elke pagina controleert bij het
openen, en bij terugkeren naar het tabblad, of de server een nieuwere versie
heeft; zo ja, dan verschijnt bovenaan een balk "Er is een nieuwe versie" met de
knop **Vernieuwen**. Pas na die klik wordt herladen (met `?v=` als
cache-buster), nooit ongevraagd.

`tools/build.py` stempelt de versie ook in `beheer.html` en `404.html` én achter
de interne `import`-regels in `assets/js/*.js`. Dat voorkomt dat na een deploy
een nieuwe module met een oude, gecachte module wordt gecombineerd (GitHub Pages
cachet 10 minuten). Bij elke push: nummer ophogen en `python3 tools/build.py`
draaien.

## Monitoring

- **Bezoekers:** https://ryantricoaching.goatcounter.com (per dag, per pagina,
  herkomst, apparaat). Script wordt alleen geladen als `goatcounter` in
  `config.js` gevuld is en niet op localhost.
- **Contactaanvragen:** e-mail van Formspree plus het overzicht op formspree.io
  (gratis tot 50 inzendingen per maand).
- **Site live?** GitHub → repo → Settings → Pages toont de laatste deploy;
  `https://ryantricoaching.nl/VERSION` geeft de live versie.
- **Gist bereikbaar?** Beheer → Instellingen toont "Laatst gepubliceerd"; de
  site valt bij storing terug op cache en `data/site.json`.
