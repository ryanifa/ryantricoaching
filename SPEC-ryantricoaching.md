# SPEC – Ryan Triathlon Coaching (ryantricoaching.nl) v1.0

Datum: 25-10-2026. Eigenaar: Ryan Douglas. Basisconcept: `ryanifa/djroggy` (statisch, Gist-data, beheer.html).

## 1. Doel
Promotiesite voor Ryans triathlon-coaching als hobbybusiness (3–4 atleten). Bezoeker moet in één scroll snappen: wie Ryan is, wat hij bereikt heeft, waarom hij dit doet, welke diensten er zijn, en hoe je contact legt. Geen webshop, geen login voor atleten. Prijzen "op aanvraag".

## 2. Doelgroep en toon
Beginners en mensen met weinig triathlon-ervaring (eerste 1/8 of 1/4, soms 1/2 of hele). Toon: warm, direct, nuchter, je-vorm, Nederlands. Geen jargon zonder uitleg (zones, CSS, watts alleen met toelichting). Belofte: "Je hoeft het niet alleen uit te zoeken."

## 3. Merk
- Naam: **Ryan Triathlon Coaching**. Domein: ryantricoaching.nl (CNAME).
- Look: licht en sportief. Witte/lichte achtergrond, sportief groen als accentkleur plus rood voor CTA's. Veel lucht, grote koppen, foto's van water/open water, fiets en lopen.
- Tokens (base.css): `--bg #F6FAF7`, `--surface #FFFFFF`, `--text #0F1F2E`, `--muted #4F6475`, `--green #1E8F5A`, `--green-deep #0F5A3C`, `--red #D7263D`, `--mint #DDF3E8`, radius 16, wrap 1120. Light mode default; dark mode optioneel via `prefers-color-scheme` met dezelfde tokens omgezet.
- Fonts: Sora 700 (koppen) + Inter 400/500/600 (tekst), Google Fonts met fallback `@font-face` size-adjust zoals djroggy.
- Logo (gekozen 25-10-2026): `assets/logo/logo.svg` — beeldmerk met fietswiel (hoge velg, vijf spaken, donkergroen), rode hardloopschoen en twee groene golven; woordmerk "Ryan **TC**" (TC in rood) met "TRIATHLON COACHING" eronder. Afgeleiden: `logo-mark.svg`, `logo-wit.svg`, `icon.svg` + PNG 32/180/192/512. Gegenereerd door `tools/logos.py`; `alt-1`/`alt-2` zijn afgevallen varianten.

## 4. Sitemap (pagina's)
| Pagina | Doel |
|---|---|
| `index.html` | Hero → "Waar sta je?" → diensten in het kort → waarom Ryan (3 USP's) → mijn verhaal (teaser) → resultaten → werkwijze (4 stappen) → ervaringen → CTA |
| `diensten.html` | Drie diensten uitgebreid + "voor wie" + wat je krijgt + prijzen op aanvraag |
| `zwemanalyse.html` | Landingspagina zwemanalyse: onderwatervideo (DJI), sensor, viewer met ingesproken feedback, voorbeeld-stills, stappen |
| `race.html` | Begeleiding naar je race: 1/8, 1/4, 1/2, hele; wat verandert per afstand; voorbeeldtijdlijn 12–20 weken |
| `over.html` | Mijn verhaal: docent informatica → triatleet → coach; de keuze om het zelf te doen; resultaten; TVS'90/CS010 |
| `werkwijze.html` | Intake → plan → wekelijks contact (WhatsApp) → bijsturen → race; wat ik van jou verwacht |
| `ervaringen.html` | Testimonials (uit Gist), aanvankelijk 1–2 |
| `contact.html` | WhatsApp-knop, Formspree-formulier (naam, e-mail, doel/afstand, huidige situatie, bericht), honeypot |
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

**Waarom Ryan (USP's):** (1) Ik doe het zelf: half (Luxemburg 70.3, 2026), marathon 3:30, open water 22 km-voorbereiding. (2) Technisch onderlegd: eigen analysetools, Garmin-data lezen, geen gokwerk. (3) Klein en persoonlijk: hooguit een handvol atleten tegelijk.

**Resultaten (feiten, uit Garmin/Strava):** Marathon Rotterdam 3:30:08 (apr 2026) · Halve marathon 1:33 · 10 km 43:47 · 5 km 19:31 · Ironman 70.3 Luxemburg (juli 2026) · Kwart triathlon Zwarte Plasje (sep 2026) · Lid TVS'90 (triathlon) en CS010 (wielrennen). Geboren 1969 → "en dat op mijn 57e".

**Mijn verhaal (over.html, 3 alinea's):** docent informatica en projectleider die triathlon oppakte; leerde door data en techniek steeds beter zwemmen, fietsen en lopen; bouwde eigen tools (trainingsapp, zwemanalyse-viewer); coachte de eerste clubgenoot naar zijn 10 km-doel; voerde gesprekken met andere coaches om samen iets op te zetten, en besloot in oktober 2026 het gewoon zelf te doen: onafhankelijk, klein, persoonlijk.

**Werkwijze (4 stappen):** Kennismaking (gratis, 30 min, bellen of koffie) → Intake & data (Strava/Garmin, blessures, agenda) → Plan & eerste 4 weken → Wekelijks contact en bijsturen tot de race.

**Ervaringen:** placeholder voor 1 testimonial (Karl, met toestemming, nog in te vullen).

**Contact:** WhatsApp-deeplink (nummer in Gist `info.whatsapp`), Formspree (`CONFIG.formspreeId`), e-mail, Instagram/Strava-links. Geen adres.

## 6. Datamodel (`data/site.json`, `normalize()` in store.js)
```
{ version, info{name, tagline, kop, intro, announcement, phone, whatsapp, email, kvk, instagram, strava, facebook, linkedin, regio},
  hero{kop, sub, ctaPrimair, ctaSecundair},
  diensten[{id, titel, kort, lang, voorWie[], watJeKrijgt[], prijsTekst, icon}],
  afstanden[{id, naam, zwem, fiets, loop, weken, voorWie}],
  usps[{id, titel, tekst}],
  resultaten[{id, label, waarde, datum}],
  werkwijze[{id, stap, titel, tekst}],
  verhaal[{id, tekst}],
  reviews[{id, naam, tekst, datum, afstand, hidden, uitgelicht}],
  faq[{id, vraag, antwoord}],
  media[{id, url, alt}], verwijderdeIds[] }
```
Beheer-tabs: Ervaringen · Diensten & afstanden · Resultaten · Verhaal & FAQ · Info · Instellingen. Zelfde admin-flow als djroggy (token/demo, concept→publiceren, back-up, beheerlink).

## 7. Techniek
- Vanilla HTML/CSS/ES-modules, geen build. GitHub Pages vanaf `main`, `CNAME` = ryantricoaching.nl, `.nojekyll`.
- Hergebruik uit djroggy (kopiëren en aanpassen): `gist.js`, `dom.js`, `store.js` (nieuw model), `admin.js`, `media.js`, `site.js` (version-check, nav, rendering), `base.css`-structuur, `tests/merge.test.js`, `manifest.webmanifest`, `sitemap.xml`, `robots.txt`, `404.html`, QR in `qr/`.
- `VERSION` in `<meta name="version">`, footer en `?v=` cache-buster. De site vergelijkt bij laden en bij terugkeren naar het tabblad de meta-versie met `VERSION` op de server; bij een nieuwere versie verschijnt een balk met de melding en een knop "Vernieuwen", pas na de klik wordt ververst.
- Toegankelijkheid: skip-link, focus-states, contrast ≥ 4.5:1, `prefers-reduced-motion`.
- SEO: title/description per pagina, OG-image (`assets/og.png`), JSON-LD `Person` + `Service`/`LocalBusiness` (Rotterdam).
- Geen cookies; GoatCounter optioneel.

## 8. Acceptatiecriteria
1. Alle pagina's renderen zonder console-errors, ook zonder Gist (fallback `data/site.json`).
2. Mobiel (390 px) geen horizontale scroll; sticky WhatsApp-knop zichtbaar.
3. `node tests/merge.test.js` slaagt.
4. Beheer: inloggen met token, concept bewerken, publiceren, back-up.
5. Logo-SVG's leesbaar op 24 px (favicon) en 200 px.
6. Teksten in je-vorm, geen Engelse UI-termen behalve WhatsApp/Strava/Garmin.

## 9. Later (niet in v1)
Atleet-pagina's met schema en zwemanalyses onder eigen login; koppeling eoSwimming-viewer op `media.ryantricoaching.nl`; betaalflow.
