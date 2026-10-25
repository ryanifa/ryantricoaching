# Werkafspraken

- Wijzigingen mogen direct naar `main` worden gepusht; geen feature-branch of PR nodig.
- Statische site zonder build-stap voor de browser; zie README.md voor opbouw en de Gist-opslag. De HTML-pagina's worden wel gegenereerd: `python3 tools/build.py` na elke wijziging in `data/site.json`, `VERSION` of `tools/build.py`.
- Taal van site, beheer en commits: Nederlands (je-vorm). Toon: warm, direct, nuchter. Geen jargon zonder uitleg; geen Engelse UI-termen behalve WhatsApp, Strava en Garmin.
- Alles wat uit de Gist of het beheer komt gaat via `textContent` (zie `assets/js/dom.js`), nooit via `innerHTML`.
- `data/site.json` is de standaarddata én de terugval; het datamodel staat in `normalize()` in `assets/js/store.js` (spec §6). Renderers werken altijd op `filter(doc)`.
- De volledige specificatie staat in `SPEC-ryantricoaching.md`.
- Design: licht en sportief (tokens in `assets/css/base.css`, Sora + Inter). Niet dark zoals djroggy; dark mode alleen via `prefers-color-scheme`.
- Logo's komen uit `tools/logos.py`; de OG-afbeelding uit `tools/og.py`. Niet met de hand bewerken, maar het script aanpassen en opnieuw draaien.
- Bij elke push naar `main` het nummer in `VERSION` ophogen (datum + volgnummer, bv. `2026.10.25-2`); het staat in de footer en achter de CSS/JS-links als cache-buster. Daarna `python3 tools/build.py`.
- Tests: `node tests/merge.test.js` moet groen zijn; `node --check` op alle JS in `assets/js/`.
