# SPEC – Ryan Triathlon Coaching (ryantricoaching.nl) v1.1

Datum: 25-10-2026, bijgewerkt 28-10-2026 (stand na livegang). Eigenaar: Ryan Douglas. Basisconcept: `ryanifa/djroggy` (statisch, Gist-data, beheer.html).

## 1. Doel
Promotiesite voor Ryans triathlon-coaching als hobbybusiness (3–4 atleten). Bezoeker moet in één scroll snappen: wie Ryan is, wat hij bereikt heeft, waarom hij dit doet, welke diensten er zijn, en hoe je contact legt. Geen webshop, geen login voor atleten. Prijzen "op aanvraag".

## 2. Doelgroep en toon
Beginners en mensen met weinig triathlon-ervaring (eerste 1/8 of 1/4, soms 1/2 of hele). Toon: warm, direct, nuchter, je-vorm, Nederlands. Geen jargon zonder uitleg (zones, CSS, watts alleen met toelichting). Slogan/tagline: **"Sneller door slimmer te trainen."** Belofte: je hoeft het niet alleen uit te zoeken; Ryan heeft alle valkuilen zelf meegemaakt.

## 3. Merk
- Naam: **Ryan Triathlon Coaching**. Domein: ryantricoaching.nl (CNAME); ryantricoaching.com verwijst door via de repo `ryanifa/ryantricoaching-com`.
- Look: licht en sportief. Witte/lichte achtergrond, sportief groen als accentkleur plus rood voor CTA's. Veel lucht, grote koppen, foto's van water/open water, fiets en lopen.
- Tokens (base.css): `--bg #F6FAF7`, `--surface #FFFFFF`, `--text #0F1F2E`, `--muted #4F6475`, `--green #1E8F5A`, `--green-deep #0F5A3C`, `--red #D7263D`, `--mint #DDF3E8`, radius 16, wrap 1120. Light mode default; dark mode optioneel via `prefers-color-scheme` met dezelfde tokens omgezet.
- Fonts: Sora 700 (koppen) + Inter 400/500/600 (tekst), Google Fonts met fallback `@font-face` size-adjust zoals djroggy.
- Logo (gekozen 25-10-2026): `assets/logo/logo.svg` — beeldmerk met fietswiel (hoge velg, vijf spaken, donkergroen), rode hardloopschoen en twee groene golven; woordmerk "Ryan **TC**" (TC in rood) met "TRIATHLON COACHING" eronder. Afgeleiden: `logo-mark.svg`, `logo-wit.svg`, `icon.svg` + PNG 32/180/192/512. Gegenereerd door `tools/logos.py`; `alt-1`/`alt-2` zijn afgevallen varianten.

## 4. Sitemap (pagina's)
| Pagina | Doel |
|---|---|
| `index.html` | Hero → "Waar sta je?" → diensten in het kort → waarom Ryan (3 USP's) → mijn verhaal (teaser) → resultaten → werkwijze (4 stappen) → ervaringen → CTA |
| `diensten.html` | Drie diensten uitgebreid + "voor wie" + wat je krijgt + prijzen op aanvraag |
| `zwemanalyse.html` | Landingspagina zwemanalyse: ingesloten voorbeeldvideo (directe mp4-link uit de eoSwimming-Worker, bewerkbaar in beheer), drie echte onderwaterstills (insteek, ligging, beenslag), stappen, sectie "Meten wat je niet kunt zien" met eo SwimBETTER-sensorbeelden en uitleg van de toegevoegde waarde, zwemachtergrond (KNZB-opleiding, trainer bij De Waterman), camera/viewer/CSS. Geen cameramerken, geen "zelf gebouwd": alleen wat de atleet ermee kan |
| `race.html` | Begeleiding naar je race: 1/8, 1/4, 1/2, hele; wat verandert per afstand; voorbeeldtijdlijn 12–20 weken |
| `over.html` | Kop + intro (bewerkbaar), verhaal (3 alinea's), cijferblok, **wedstrijdenlijst** per categorie uit Garmin (met DNF-markering), "Clubs en achtergrond" (TVS'90 Spijkenisse, CS010 Rotterdam, KNZB, De Waterman, ICT-loopbaan) en disclaimer |
| `werkwijze.html` | Intake → plan → wekelijks contact (WhatsApp) → bijsturen → race; wat ik van jou verwacht |
| `ervaringen.html` | Testimonials (uit Gist), aanvankelijk 1–2 |
| `contact.html` | WhatsApp-knop, Formspree-formulier `mnppdepj` (naam*, e-mail*, doel, huidige situatie, bericht, akkoord*), honeypot, `_next` → `bedankt.html`; id in config én in de HTML |
| `privacy.html`, `voorwaarden.html`, `bedankt.html`, `404.html` | standaard |
| `beheer.html` | beheer zoals djroggy |

Navigatie: Diensten · Zwemanalyse · Race · Werkwijze · Over Ryan · Ervaringen · Contact (CTA-knop). Mobiel: hamburger + sticky WhatsApp-knop onderaan.

## 5. Inhoud (vaste teksten, in `data/site.json`)
**Hero:** "Je eerste triathlon? Ik help je er komen." Sub: "Persoonlijke coaching voor beginners en gevorderden: zwemanalyse, trainingsschema's en begeleiding naar je 1/8, 1/4, 1/2 of hele triathlon. Vanuit Rotterdam, met jou op de plek waar je traint." CTA primair: "Plan een kennismaking" (WhatsApp). Secundair: "Bekijk de diensten".

**Waar sta je?** drie kaarten: *Ik wil mijn eerste triathlon doen* · *Ik wil sneller en slimmer trainen* · *Ik wil beter leren zwemmen*. Elk linkt naar de passende dienst.

**Diensten:**
1. **Zwemanalyse** — onderwateropname, eventueel met eo SwimBETTER-sensor, analyse in een eigen viewer: frame voor frame, ingesproken feedback en tekeningen, terug te kijken op je telefoon. Resultaat: 3–5 concrete verbeterpunten + oefeningen.
2. **Trainingsschema's fietsen & lopen** — schema op maat voor je doel en beschikbare tijd, in heldere taal, met tempo- en hartslaggrenzen die je op je Garmin zet. Wekelijks bijgestuurd op hoe het gaat.
3. **Begeleiding naar je race** — van intake tot finish: 1/8, 1/4, 1/2 of hele triathlon. Wekelijks contact via WhatsApp, schema's voor alle drie de onderdelen, wisselzones en racedag.
Prijzen: "Op aanvraag; ik werk met een klein aantal atleten tegelijk, dus we kijken samen wat past."

**Waarom Ryan (USP's):** (1) Sneller door slimmer te trainen: op mijn 57e nog steeds sneller, data/techniek/rust, palmares. (2) Alle valkuilen zelf meegemaakt: te hard, te veel, te vroeg; op de harde manier geleerd, dat wil ik jou besparen. (3) Klein en persoonlijk: hooguit een handvol atleten tegelijk.

**Resultaten (bron: Garmin Connect, multisport + hardlopen ≥ 42 km, sinds 2016; Garmin is de waarheid):** cijferblok 4× hele · 4× halve · 15× kwart · 11× marathons · snelste marathon 3:30:08 (apr 2026) · buiten zwemmen hele jaar · 10+ SwimRuns (eigen opgave). Wedstrijdenlijst: 43 items (hele: Almere 2019/2023/2025, Ironman Maastricht 2022, Challenge Roth 2025 DNF; halve: Almere 2017/2018, Ironman 70.3 Luxemburg 2022, Vichy 2023; 15 kwart; 3 achtste; 4 overige; 11 marathons incl. New York 2016; ultra Brasseuse 2019). Horlogetijden. Geboren 1969 → "en dat op mijn 57e". Volgend jaar: Ironman Kopenhagen.

**Mijn verhaal (over.html, 3 alinea's):** kop "Programmeur, ondernemer, docent, triatleet. En nu coach."; alinea 1 de ICT-loopbaan (programmeur, SAP-consultant, eigen bedrijf, trainingen, docent informatica, nu AI en procesoptimalisatie bij HbR); alinea 2 triathlon: oppakte; leerde door data en techniek steeds beter zwemmen, fietsen en lopen; bouwde eigen tools (trainingsapp, zwemanalyse-viewer); coachte de eerste clubgenoot naar zijn 10 km-doel; voerde gesprekken met andere coaches om samen iets op te zetten, en besloot in oktober 2026 het gewoon zelf te doen: onafhankelijk, klein, persoonlijk.

**Werkwijze (4 stappen):** Kennismaking (gratis, 30 min, bellen of koffie) → Intake & data (Strava/Garmin, blessures, agenda) → Plan & eerste 4 weken → Wekelijks contact en bijsturen tot de race.

**Ervaringen:** Karl staat klaar in beheer (verborgen tot toestemming).

**Foto's:** hero = finishfoto Ironman (`assets/img/ryan.jpg`); verhaalblok en Over Ryan = loopfoto langs het water (`ryan-loop.jpg`); kwart-finishfoto Zwarte Plasje beschikbaar als reserve.

**Contact:** WhatsApp-deeplink (nummer in Gist `info.whatsapp`), Formspree (`CONFIG.formspreeId` = `mnppdepj`), e-mail, Instagram (@ironryandouglas)/Strava-links. Geen adres.

## 6. Datamodel (`data/site.json`, `normalize()` in store.js)
```
{ version, info{name, tagline, kop, intro, announcement, phone, whatsapp, email, kvk, instagram, strava, facebook, linkedin, regio},
  hero{kop, sub, ctaPrimair, ctaSecundair},
  diensten[{id, titel, kort, lang, voorWie[], watJeKrijgt[], prijsTekst, icon}],
  afstanden[{id, naam, zwem, fiets, loop, weken, voorWie}],
  usps[{id, titel, tekst}],
  resultaten[{id, label, waarde, datum}],
  werkwijze[{id, stap, titel, tekst}],
  verhaal[{id, tekst}], clubsTekst, clubsDisclaimer, overKop, overIntro, voorbeeldVideoUrl, zwemAchtergrond,
  wedstrijden[{id, datum, naam, categorie (hele|halve|kwart|achtste|overig-tri|marathon|ultra), tijd, hidden}],
  reviews[{id, naam, tekst, datum, afstand, hidden, uitgelicht}],
  faq[{id, vraag, antwoord}],
  media[{id, url, alt}], verwijderdeIds[] }
```
Beheer-tabs: Ervaringen · Diensten & afstanden · Resultaten · Verhaal & FAQ · Info · Instellingen. Zelfde admin-flow als djroggy (token/demo, concept→publiceren, back-up, beheerlink).

## 7. Techniek
- Vanilla HTML/CSS/ES-modules, geen build. GitHub Pages vanaf `main`, `CNAME` = ryantricoaching.nl, `.nojekyll`.
- Hergebruik uit djroggy (kopiëren en aanpassen): `gist.js`, `dom.js`, `store.js` (nieuw model), `admin.js`, `media.js`, `site.js` (version-check, nav, rendering), `base.css`-structuur, `tests/merge.test.js`, `manifest.webmanifest`, `sitemap.xml`, `robots.txt`, `404.html`, QR in `qr/`.
- `VERSION` in `<meta name="version">`, footer en `?v=` cache-buster. De site vergelijkt bij laden en bij terugkeren naar het tabblad de meta-versie met `VERSION` op de server; bij een nieuwere versie verschijnt een balk met de melding en een knop "Vernieuwen", pas na de klik wordt ververst. `tools/build.py` stempelt de versie ook in `beheer.html`, `404.html` en achter de interne JS-imports (tegen gemengde cache na een deploy).
- Formulier: Formspree, id in `config.js` en in de HTML gebakken; werkt zonder JS. Statistieken: GoatCounter (code in `config.js`, cookieloos, niet op localhost); dashboard ryantricoaching.goatcounter.com.
- Hosting: GitHub Pages vanaf `main` (geen Actions). DNS bij Hostnet: A 185.199.108–111.153, AAAA 2606:50c0:8000::153, `www` CNAME ryanifa.github.io; zelfde voor `.com`.
- Toegankelijkheid: skip-link, focus-states, contrast ≥ 4.5:1, `prefers-reduced-motion`.
- SEO: title/description per pagina, OG-image (`assets/og.png`), JSON-LD `Person` + `Service`/`LocalBusiness` (Rotterdam).
- Geen cookies (GoatCounter is cookieloos).

## 8. Acceptatiecriteria
1. Alle pagina's renderen zonder console-errors, ook zonder Gist (fallback `data/site.json`).
2. Mobiel (390 px) geen horizontale scroll; sticky WhatsApp-knop zichtbaar.
3. `node tests/merge.test.js` slaagt.
4. Beheer: inloggen met token, concept bewerken, publiceren, back-up.
5. Logo-SVG's leesbaar op 24 px (favicon) en 200 px.
6. Teksten in je-vorm, geen Engelse UI-termen behalve WhatsApp/Strava/Garmin.
7. Contactformulier levert een e-mail op en landt op `bedankt.html` (getest 28-10-2026).
8. Bezoek verschijnt in GoatCounter binnen een minuut.
9. Na een push: versiebalk op open tabbladen, herladen alleen na klik, geen module-fouten in de console.

## 9. Later (niet in v1)
Atleet-pagina's met schema en zwemanalyses onder eigen login; koppeling eoSwimming-viewer op `media.ryantricoaching.nl`; betaalflow; annotaties van eoSwimming achter de Worker (AVG) vóór betaalde klanten; vervaldatum voorbeeldvideo-link (27-10-2027) bewaken.

## 10. Historie
- 25-10: spec, bouw, logo (groen/rood, wiel met vijf spaken), live op GitHub Pages, DNS .nl en .com.
- 26-10: vier hele's en buitenzwemmen in teksten, videoslot zwemanalyse.
- 27-10: sensorsectie, echte stills, voorbeeldvideo via Worker, Gist gekoppeld, update-balk met knop, Over-kop/intro en clubs bewerkbaar, wedstrijdenlijst uit Garmin, import-stempeling.
- 28-10: slogan en valkuilen-USP, Formspree, KNZB/De Waterman, Ironman-foto's, GoatCounter, Facebook- en Instagram-aankondiging.
