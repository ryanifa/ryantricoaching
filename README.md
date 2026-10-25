# Ryan Triathlon Coaching

Website van Ryan Douglas, triathlon-coach uit Rotterdam: zwemanalyse,
trainingsschema's en begeleiding naar je 1/8, 1/4, 1/2 of hele triathlon.
Bezoekers zien een snelle, lichte, mobielvriendelijke site; Ryan past
ervaringen, diensten, resultaten, zijn verhaal en contactgegevens zelf aan via
`beheer.html`.

Geen server, geen build-stap, geen dependencies: statische bestanden op GitHub
Pages, en de gegevens staan als één JSON-bestand in een **Gist** (de "database").
De opzet is overgenomen van `ryanifa/djroggy`.

Specificatie: **`SPEC-ryantricoaching.md`** (versie 1.0).

## Hoe het werkt

| | |
|---|---|
| Hosting | GitHub Pages (deze repo, vanuit `main`), eigen domein **ryantricoaching.nl** via `CNAME` |
| Gegevens | `site.json` in een openbare Gist |
| Lezen (bezoekers) | Zonder sleutel, rechtstreeks van de GitHub-API |
| Schrijven (beheer) | Met een GitHub-sleutel die alleen Gists mag |
| Terugval | `data/site.json` in de repo, plus een cache in de browser |
| Contactformulier | per e-mail via Formspree (id in `assets/js/config.js`), daarna `bedankt.html`; alternatief: hetzelfde bericht als WhatsApp-bericht naar `info.whatsapp` |
| Statistieken | GoatCounter, alleen actief als de code in `config.js` staat; geen cookies |

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
| Gegevens | Gist: nog aanmaken (zie hieronder); `gistId` in `assets/js/config.js` is nu leeg, dus bezoekers zien `data/site.json` |

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
   en zet het id in `config.js` (`formspreeId`).
6. **Telefoonnummer:** vul in beheer → Info het WhatsApp-nummer in en publiceer.
   Tot die tijd wijzen alle WhatsApp-knoppen naar het formulier.
7. **Foto:** zet `assets/img/ryan.jpg` in de repo (zie `assets/img/README.md`).
8. **DNS:** `ryantricoaching.nl` als CNAME/A-records naar GitHub Pages; `CNAME`
   in de repo staat al klaar.

Eerst rondkijken kan ook: *Demo zonder sleutel* op de inlogpagina. Wijzigingen
blijven dan in je browser, en de website laat ze (alleen in die browser) zien
met een gele balk erboven.

## Beheren (tabs in `beheer.html`)

- **Ervaringen** — ervaringen van atleten: naam, afstand, datum, tekst,
  *uitgelicht* (homepage) en *verbergen*. Een ervaring zonder tekst blijft
  automatisch verborgen (de placeholder voor Karl staat al klaar).
- **Diensten** — de drie diensten (tekst, voor wie, wat je krijgt, prijstekst),
  de prijstekst, de afstanden op de racepagina en de drie "Waar sta je?"-kaarten.
- **Resultaten** — de feiten uit Garmin/Strava (label, tijd, maand), de noot
  eronder en de drie punten "Waarom Ryan".
- **Verhaal & FAQ** — alinea's van "Mijn verhaal", de werkwijze-stappen, "Wat ik
  van jou verwacht" en de veelgestelde vragen.
- **Info** — kop en knoppen op de homepage, mededeling, naam, tagline, regio,
  WhatsApp, telefoon, e-mail, KvK, Instagram, Strava, Facebook, LinkedIn.
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
assets/js/admin.js      het beheer
assets/js/media.js      foto's verkleinen en uploaden (nog niet gebruikt in v1)
assets/js/dom.js        kleine DOM-hulpjes (alles via textContent)
assets/css/             base.css (tokens, gedeeld), site.css, admin.css
assets/logo/            logo.svg, logo-mark.svg, logo-wit.svg, icon.svg, PNG-iconen, alt-1/alt-2 (alternatieve beeldmerken)
assets/img/ryan.jpg     foto van Ryan (zelf toevoegen)
assets/og.png           Open Graph-afbeelding (1200×630)
qr/                     QR-code naar de site
tools/build.py          genereert de HTML-pagina's uit data/site.json
tools/logos.py          genereert de logo-SVG's en PNG-iconen
tools/og.py             genereert assets/og.png
tests/merge.test.js     tests voor normalize/filter/mergeDefaults
```

Lokaal bekijken: `python3 -m http.server` in de repo en open
`http://localhost:8000`.

Elke pagina bevat de standaardinhoud al in de HTML (uit `data/site.json`),
zodat de site ook zonder JavaScript en zonder GitHub werkt; `site.js` vervangt
die inhoud zodra de actuele gegevens binnen zijn. De pagina's worden
gegenereerd met `python3 tools/build.py`; verander je vaste teksten in
`data/site.json` of het nummer in `VERSION`, draai dat script dan opnieuw.

## Logo

Beeldmerk: drie golvende lijnen die overgaan in een wiel en een loopstreep
("zwem-fiets-loop in één lijn"). `logo.svg` is de standaard (horizontaal, met
woordmerk), `logo-mark.svg` alleen het beeldmerk, `logo-wit.svg` voor donkere
ondergrond, `icon.svg` het favicon op groene tegel. `alt-1.svg` (monogram TC)
en `alt-2.svg` (ronde badge) zijn alternatieven om uit te kiezen. Alles komt
uit `tools/logos.py`.

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
heeft; zo ja, dan ververst de pagina één keer automatisch (op de contactpagina
verschijnt een balk met een knop, zodat een ingevuld formulier niet verloren
gaat). Bij elke push: nummer ophogen en `python3 tools/build.py` draaien.
