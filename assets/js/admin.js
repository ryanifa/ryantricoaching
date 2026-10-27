/* Beheer: inloggen met een GitHub-sleutel en de website-gegevens bewerken.
   De gegevens staan als één JSON-bestand in een Gist; bezoekers lezen die
   zonder sleutel, alleen de beheerder kan schrijven. Zelfde flow als
   djroggy: concept in localStorage, Publiceren met conflictcheck,
   back-up, demo zonder sleutel, beheerlink voor op de telefoon. */

import { CONFIG } from './config.js';
import { el, $, clear, uid, toast } from './dom.js';
import { checkToken, readGist, createGist, writeGist, GistError } from './gist.js';
import {
  normalize, bundledDoc, activeGistId, setLocalGistId, demoDoc, setDemoDoc, cacheDoc, storageGet, storageSet,
  todayIso, filter, formatDatum, mergeDefaults, DIENST_ICONS, AFSTANDEN,
} from './store.js';

const SESSION_KEY = 'rtc.admin';
const DRAFT_KEY = 'rtc.draft';

const state = {
  session: null,       // { token, login } of { demo: true }
  gistId: '',
  doc: null,           // werkversie
  savedJson: '',       // laatst gepubliceerde versie, om "gewijzigd" te bepalen
  baseUpdatedAt: null, // updated_at van de Gist toen we hem lazen
  gistOwner: '',
  tab: 'reviews',
  saving: false,
  mergeHint: null,     // rapport van de droge merge-run bij het openen (één keer per sessie)
};

const app = () => $('#app');

/* =============================================================== helpers */

const isDirty = () => state.doc && JSON.stringify(state.doc) !== state.savedJson;
const draftKey = () => (state.session?.demo ? 'demo' : state.gistId);
const nlDate = (iso) => (iso ? formatDatum(iso, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function changed({ rerender = true } = {}) {
  storageSet(DRAFT_KEY, { key: draftKey(), doc: state.doc, base: state.baseUpdatedAt });
  if (rerender) renderTab();
  renderSaveBar();
}

function move(list, index, delta) {
  const to = index + delta;
  if (to < 0 || to >= list.length) return;
  const [x] = list.splice(index, 1);
  list.splice(to, 0, x);
}

function errorText(err) {
  return err instanceof GistError ? err.message : (err?.message || 'Er ging iets mis.');
}

function iconBtn(label, symbol, onclick, extra = '') {
  return el('button', { type: 'button', class: `icon-btn ${extra}`, title: label, 'aria-label': label, text: symbol, onclick });
}

function field(label, input, help) {
  return el('label', { class: 'field' }, [
    el('span', { class: 'field-label', text: label }),
    input,
    help ? el('span', { class: 'field-help', text: help }) : null,
  ]);
}

function toggle(label, checked, onchange, extra = '') {
  return el('label', { class: `switch ${extra}` }, [
    el('input', { type: 'checkbox', checked, onchange: (e) => onchange(e.target.checked) }),
    el('span', { class: 'switch-track', 'aria-hidden': 'true' }),
    el('span', { class: 'switch-label', text: label }),
  ]);
}

/** Een item dat de beheerder bewust verwijdert, komt bij "Samenvoegen" niet terug. */
function registreerVerwijderd(item) {
  if (!item?.id) return;
  const list = state.doc.verwijderdeIds;
  if (!list.includes(String(item.id))) list.push(String(item.id));
}

const badge = (text, cls = '') => el('span', { class: `badge ${cls}`, text });

/* ================================================================= modal */

/**
 * Generiek formulier in een dialoog.
 * fields: [{ key, label, type: text|textarea|number|checkbox|select|date|url|static, value, placeholder, help, options, disabled }]
 */
function openForm({ title, fields, submitText = 'Opslaan', onSave, onDelete, deleteText = 'Verwijderen' }) {
  const dialog = $('#modal');
  const form = clear($('#modal-form'));
  const inputs = {};

  const body = el('div', { class: 'modal-body' });
  for (const f of fields) {
    let input;
    if (f.type === 'textarea') {
      input = el('textarea', { rows: f.rows || 3, class: f.tall ? 'tall' : null, placeholder: f.placeholder || '', value: f.value ?? '' });
    } else if (f.type === 'checkbox') {
      input = el('input', { type: 'checkbox', checked: !!f.value });
      body.append(el('label', { class: 'switch' }, [input, el('span', { class: 'switch-track' }), el('span', { class: 'switch-label', text: f.label })]));
      inputs[f.key] = input;
      continue;
    } else if (f.type === 'static') {
      body.append(el('div', { class: 'field' }, [el('span', { class: 'field-label', text: f.label }), el('span', { text: f.value || '—' }), f.help ? el('span', { class: 'field-help', text: f.help }) : null]));
      continue;
    } else if (f.type === 'date') {
      input = el('input', { type: 'date', value: f.value || '' });
    } else if (f.type === 'month') {
      input = el('input', { type: 'month', value: f.value || '', placeholder: '2026-04' });
    } else if (f.type === 'select') {
      input = el('select', { value: f.value, disabled: !!f.disabled }, f.options.map((o) => el('option', { value: o.value, text: o.label })));
    } else if (f.type === 'number') {
      input = el('input', { type: 'text', inputmode: 'numeric', placeholder: f.placeholder || '', value: f.value === null || f.value === undefined ? '' : String(f.value) });
    } else if (f.type === 'url') {
      input = el('input', { type: 'url', inputmode: 'url', placeholder: f.placeholder || 'https://…', value: f.value ?? '', spellcheck: 'false' });
    } else {
      input = el('input', { type: 'text', placeholder: f.placeholder || '', value: f.value ?? '', maxlength: f.maxlength || null, disabled: !!f.disabled });
    }
    inputs[f.key] = input;
    body.append(field(f.label, input, f.help));
  }

  const error = el('p', { class: 'form-error', hidden: true });

  form.append(
    el('header', { class: 'modal-head' }, [
      el('h2', { text: title }),
      el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Sluiten', text: '✕', onclick: () => dialog.close() }),
    ]),
    body,
    error,
    el('footer', { class: 'modal-foot' }, [
      onDelete ? el('button', {
        type: 'button', class: 'btn btn-danger btn-sm', text: deleteText,
        onclick: () => { dialog.close(); onDelete(); },
      }) : null,
      el('span', { class: 'spacer' }),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Annuleren', onclick: () => dialog.close() }),
      el('button', { type: 'submit', class: 'btn btn-primary btn-sm', text: submitText }),
    ]),
  );

  form.onsubmit = (e) => {
    e.preventDefault();
    const values = {};
    for (const f of fields) {
      const input = inputs[f.key];
      if (f.type === 'static') continue;
      if (f.type === 'checkbox') values[f.key] = input.checked;
      else if (f.type === 'number') {
        const raw = input.value.trim().replace(',', '.');
        if (raw === '') values[f.key] = 0;
        else if (!Number.isFinite(Number(raw)) || Number(raw) < 0) {
          error.textContent = `"${f.label}" moet een getal zijn.`;
          error.hidden = false;
          input.focus();
          return;
        } else values[f.key] = Math.round(Number(raw));
      } else if (f.type === 'date') {
        values[f.key] = /^\d{4}-\d{2}-\d{2}$/.test(input.value) ? input.value : '';
      } else if (f.type === 'month') {
        values[f.key] = /^\d{4}-\d{2}$/.test(input.value) ? input.value : '';
      } else values[f.key] = input.value.trim();
    }
    const problem = onSave(values);
    if (typeof problem === 'string') {
      error.textContent = problem;
      error.hidden = false;
      return;
    }
    dialog.close();
  };

  dialog.showModal();
  const first = form.querySelector('input:not([type=checkbox]):not([disabled]), textarea, select');
  if (first && window.matchMedia('(pointer: fine)').matches) first.focus();
}

function confirmBox(message, { okText = 'Doorgaan', danger = false } = {}) {
  return new Promise((resolve) => {
    const dialog = $('#modal');
    const form = clear($('#modal-form'));
    // Bewust niet op het 'close'-event wachten: dat komt asynchroon binnen en kan
    // nog van de vorige dialoog zijn.
    const finish = (answer) => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.close();
      resolve(answer);
    };
    const onCancel = () => finish(false);
    form.append(
      el('div', { class: 'modal-body' }, [el('p', { class: 'confirm-text', text: message })]),
      el('footer', { class: 'modal-foot' }, [
        el('span', { class: 'spacer' }),
        el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Annuleren', onclick: () => finish(false) }),
        el('button', {
          type: 'button', class: `btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm`, text: okText,
          onclick: () => finish(true),
        }),
      ]),
    );
    form.onsubmit = (e) => e.preventDefault();
    dialog.addEventListener('cancel', onCancel);
    if (!dialog.open) dialog.showModal();
  });
}

/* ================================================================= login */

function renderLogin(message = '') {
  const keyInput = el('input', {
    type: 'password', id: 'key', autocomplete: 'current-password', spellcheck: 'false',
    placeholder: 'github_pat_… of ghp_…',
  });
  const btn = el('button', { type: 'submit', class: 'btn btn-primary', text: 'Inloggen' });

  const submit = async (e) => {
    e.preventDefault();
    const token = keyInput.value.trim();
    if (!token) return keyInput.focus();
    btn.disabled = true;
    btn.textContent = 'Controleren…';
    try {
      await login(token);
    } catch (err) {
      renderLogin(errorText(err));
      $('#key').value = token;
    }
  };

  clear(app()).append(el('div', { class: 'login' }, [
    el('form', { class: 'login-card', onsubmit: submit }, [
      el('img', { src: 'assets/logo/logo.svg', alt: 'Ryan Triathlon Coaching', class: 'login-logo', width: 220, height: 47 }),
      el('h1', { text: 'Beheer' }),
      el('p', { class: 'muted', text: 'Log in met je sleutel om ervaringen, diensten, resultaten, je verhaal en je contactgegevens aan te passen.' }),
      field('Sleutel', keyInput),
      message ? el('p', { class: 'form-error', text: message }) : null,
      btn,
      el('details', { class: 'help' }, [
        el('summary', { text: 'Hoe kom ik aan een sleutel?' }),
        el('ol', {}, [
          el('li', {}, ['Ga naar ', el('a', { href: 'https://github.com/settings/personal-access-tokens/new', target: '_blank', rel: 'noopener', text: 'GitHub → Fine-grained token' }), '.']),
          el('li', {}, ['Zet bij ', el('strong', { text: 'Account permissions → Gists' }), ' de waarde op ', el('strong', { text: 'Read and write' }), '. De rest mag uit.']),
          el('li', { text: 'Kies een vervaldatum, maak de sleutel en plak hem hierboven.' }),
        ]),
        el('p', { class: 'muted small', text: 'De sleutel blijft alleen op dit apparaat bewaard en gaat rechtstreeks naar GitHub, nergens anders heen.' }),
      ]),
    ]),
    el('div', { class: 'login-alt' }, [
      el('p', { class: 'muted small', text: 'Eerst rondkijken? In de demo werkt alles, maar blijven wijzigingen in deze browser.' }),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Demo zonder sleutel', onclick: () => startDemo() }),
      el('a', { class: 'btn btn-ghost btn-sm', href: './', text: 'Naar de website' }),
    ]),
  ]));
  setTimeout(() => keyInput.focus(), 50);
}

async function login(token) {
  const login = await checkToken(token);
  state.session = { token, login };
  storageSet(SESSION_KEY, state.session);
  await openGistOrSetup();
}

async function openGistOrSetup() {
  state.gistId = activeGistId();
  if (!state.gistId) return renderSetup();
  clear(app()).append(el('p', { class: 'loading', text: 'Gegevens ophalen…' }));
  try {
    const remote = await readGist(state.gistId, CONFIG.gistFile, state.session.token);
    if (remote.owner && state.session.login && remote.owner !== state.session.login) {
      toast(`Let op: deze Gist is van ${remote.owner}, je sleutel van ${state.session.login}. Publiceren gaat dan niet.`, 'error', 8000);
    }
    state.gistOwner = remote.owner || '';
    loadDoc(normalize(remote.doc), remote.updatedAt);
  } catch (err) {
    if (err.status === 404 && !CONFIG.gistId) {
      setLocalGistId('');
      toast('De gekoppelde Gist bestaat niet meer.', 'error', 5000);
      return renderSetup();
    }
    renderLogin(errorText(err));
  }
}

async function startDemo({ fresh = true } = {}) {
  state.session = { demo: true };
  storageSet(SESSION_KEY, state.session);
  let doc = demoDoc();
  if (!doc) {
    doc = await bundledDoc();
    setDemoDoc(doc);
  }
  loadDoc(normalize(doc), null);
  if (fresh) toast('Demo gestart. "Publiceren" toont je wijzigingen op de website in déze browser.', 'ok', 5000);
}

function loadDoc(doc, updatedAt) {
  state.doc = doc;
  state.savedJson = JSON.stringify(doc);
  state.baseUpdatedAt = updatedAt;

  const draft = storageGet(DRAFT_KEY);
  if (draft?.key === draftKey() && draft.doc) {
    const draftDoc = normalize(draft.doc);
    if (JSON.stringify(draftDoc) !== state.savedJson) {
      state.doc = draftDoc;
      toast('Je niet-gepubliceerde wijzigingen zijn teruggezet.', 'ok', 4000);
    }
  }
  renderShell();
  checkMergeHint();
}

/** Eén keer per sessie droog samenvoegen: is er iets nieuws, dan een balk bovenaan. */
async function checkMergeHint() {
  let seen = false;
  try { seen = sessionStorage.getItem('rtc.mergehint') === '1'; } catch { /* privémodus */ }
  if (seen || state.mergeHint !== null) return;
  try {
    const { rapport } = mergeDefaults(state.doc, await bundledDoc());
    state.mergeHint = rapport.toegevoegd.length + rapport.ingevuld.length ? rapport : false;
  } catch { state.mergeHint = false; }
  try { sessionStorage.setItem('rtc.mergehint', '1'); } catch { /* privémodus */ }
  if (state.mergeHint) renderShell();
}

/* ================================================================= setup */

function renderSetup() {
  const idInput = el('input', { type: 'text', placeholder: 'bijv. 3f9a2c…', spellcheck: 'false' });
  clear(app()).append(el('div', { class: 'login' }, [
    el('div', { class: 'login-card wide' }, [
      el('p', { class: 'eyebrow', text: `Ingelogd als ${state.session.login || 'beheerder'}` }),
      el('h1', { text: 'Nog één stap' }),
      el('p', { class: 'muted', text: 'De gegevens worden bewaard in een Gist op GitHub. Die is er nog niet. Maak er één aan (hij wordt gevuld met de huidige gegevens van de site) of koppel een bestaande.' }),
      el('button', {
        type: 'button', class: 'btn btn-primary', id: 'create', text: 'Nieuwe Gist aanmaken',
        onclick: async (e) => {
          e.target.disabled = true;
          e.target.textContent = 'Bezig…';
          try {
            const doc = await bundledDoc();
            const { id, updatedAt } = await createGist(state.session.token, CONFIG.gistFile, doc);
            setLocalGistId(id);
            state.gistId = id;
            state.gistOwner = state.session.login || '';
            loadDoc(doc, updatedAt);
            state.tab = 'settings';
            renderShell();
            toast('Gist aangemaakt! Zet het id nog in config.js (zie Instellingen).', 'ok', 7000);
          } catch (err) {
            e.target.disabled = false;
            e.target.textContent = 'Nieuwe Gist aanmaken';
            toast(errorText(err), 'error', 6000);
          }
        },
      }),
      el('div', { class: 'divider', text: 'of' }),
      field('Bestaande Gist-id', idInput, 'Het laatste stuk van de Gist-link: gist.github.com/<naam>/<id>'),
      el('button', {
        type: 'button', class: 'btn btn-ghost', text: 'Koppelen',
        onclick: async () => {
          const id = idInput.value.trim().split('/').pop();
          if (!id) return idInput.focus();
          setLocalGistId(id);
          await openGistOrSetup();
        },
      }),
      el('button', { type: 'button', class: 'linkish', text: 'Uitloggen', onclick: logout }),
    ]),
  ]));
}

/* ================================================================= shell */

const TABS = [
  ['reviews', 'Ervaringen', '💬'],
  ['diensten', 'Diensten', '🏊'],
  ['resultaten', 'Resultaten', '🏅'],
  ['verhaal', 'Verhaal & FAQ', '📖'],
  ['info', 'Info', 'ℹ️'],
  ['settings', 'Instellingen', '⚙️'],
];

function renderShell() {
  const demo = !!state.session.demo;
  clear(app()).append(...[
    demo ? el('div', { class: 'demo-strip', text: 'Demo: wijzigingen blijven in deze browser' }) : null,
    state.mergeHint ? el('button', { type: 'button', class: 'merge-strip', onclick: () => { state.tab = 'settings'; renderShell(); window.scrollTo(0, 0); } },
      `Er zijn nieuwe standaardteksten beschikbaar (${state.mergeHint.toegevoegd.length + state.mergeHint.ingevuld.length}): bekijk ze bij Instellingen`) : null,
    el('header', { class: 'admin-top' }, [
      el('a', { class: 'admin-brand', href: './', title: 'Naar de website' }, [
        el('img', { src: 'assets/logo/logo-mark.svg', alt: '', width: 32, height: 32 }),
        el('span', {}, [el('strong', { text: 'Beheer' }), el('small', { text: state.doc.info.name })]),
      ]),
      el('span', { class: 'status', id: 'status' }),
      el('a', { class: 'btn btn-ghost btn-xs hide-sm', href: './', target: '_blank', rel: 'noopener', text: 'Bekijk site ↗' }),
    ]),
    el('nav', { class: 'tabs', role: 'tablist' }, TABS.map(([id, label, emoji]) => el('button', {
      type: 'button', role: 'tab', class: state.tab === id ? 'active' : '', 'aria-selected': String(state.tab === id),
      onclick: () => { state.tab = id; renderShell(); window.scrollTo(0, 0); },
    }, [el('span', { class: 'tab-emoji', text: emoji, 'aria-hidden': 'true' }), el('span', { text: label })]))),
    el('main', { class: 'admin-main', id: 'tab' }),
    el('div', { class: 'savebar', id: 'savebar' }),
  ].filter(Boolean));
  renderTab();
  renderSaveBar();
}

function renderTab() {
  const main = $('#tab');
  if (!main) return;
  const y = window.scrollY;
  clear(main);
  if (state.tab === 'reviews') renderReviewsTab(main);
  else if (state.tab === 'diensten') renderDienstenTab(main);
  else if (state.tab === 'resultaten') renderResultatenTab(main);
  else if (state.tab === 'verhaal') renderVerhaalTab(main);
  else if (state.tab === 'info') renderInfoTab(main);
  else renderSettingsTab(main);
  window.scrollTo(0, y);
}

function renderSaveBar() {
  const dirty = isDirty();
  const status = $('#status');
  if (status) {
    status.textContent = dirty ? 'Niet gepubliceerd' : 'Alles gepubliceerd';
    status.className = `status ${dirty ? 'dirty' : 'clean'}`;
  }
  const bar = $('#savebar');
  if (!bar) return;
  bar.classList.toggle('show', dirty);
  clear(bar).append(el('div', { class: 'savebar-inner' }, [
    el('span', { class: 'savebar-text', text: 'Je hebt wijzigingen die nog niet op de website staan.' }),
    el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Ongedaan maken', disabled: state.saving, onclick: revert }),
    el('button', { type: 'button', class: 'btn btn-primary btn-sm', text: state.saving ? 'Publiceren…' : 'Publiceren', disabled: state.saving, onclick: publish }),
  ]));
}

async function revert() {
  if (!(await confirmBox('Alle wijzigingen sinds de laatste keer publiceren weggooien?', { okText: 'Weggooien', danger: true }))) return;
  state.doc = JSON.parse(state.savedJson);
  storageSet(DRAFT_KEY, null);
  renderShell();
}

async function publish() {
  if (state.saving) return;
  state.saving = true;
  renderSaveBar();
  try {
    if (state.session.demo) {
      setDemoDoc(state.doc);
    } else {
      // Kijk eerst of iemand anders intussen iets heeft gepubliceerd.
      const remote = await readGist(state.gistId, CONFIG.gistFile, state.session.token);
      const remoteJson = JSON.stringify(normalize(remote.doc));
      if (state.baseUpdatedAt && remote.updatedAt !== state.baseUpdatedAt && remoteJson !== state.savedJson) {
        const ok = await confirmBox('De gegevens zijn intussen op een ander apparaat aangepast. Als je nu publiceert, overschrijf je die wijzigingen.', { okText: 'Toch publiceren', danger: true });
        if (!ok) return;
      }
      const { updatedAt } = await writeGist(state.session.token, state.gistId, CONFIG.gistFile, state.doc);
      state.baseUpdatedAt = updatedAt;
      cacheDoc(state.doc, updatedAt);
    }
    state.savedJson = JSON.stringify(state.doc);
    storageSet(DRAFT_KEY, null);
    toast('Gepubliceerd! De website is bijgewerkt.', 'ok');
  } catch (err) {
    toast(`Publiceren mislukt: ${errorText(err)}`, 'error', 7000);
  } finally {
    state.saving = false;
    renderSaveBar();
  }
}

/* ======================================================= ervaringen tab */

const AFSTAND_OPTIONS = [{ value: '', label: 'Kies…' }, ...AFSTANDEN.map((a) => ({ value: a, label: a }))];

function renderReviewsTab(main) {
  const doc = state.doc;
  const zichtbaar = filter(doc).reviews.length;
  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: 'Ervaringen van atleten' }),
    el('div', { class: 'stats-strip' }, [
      el('span', {}, [el('strong', { text: String(zichtbaar) }), ' zichtbaar op de site']),
      el('span', {}, [el('strong', { text: String(doc.reviews.length) }), ' in totaal']),
    ]),
    el('p', { class: 'muted small', text: 'Vraag altijd toestemming voor je een ervaring met naam plaatst. Een ervaring zonder tekst blijft automatisch verborgen.' }),
  ]));
  main.append(el('div', { class: 'toolbar' }, [el('button', { type: 'button', class: 'btn btn-primary btn-sm', text: '+ Ervaring toevoegen', onclick: () => editReview(null) })]));

  const list = doc.reviews.slice().sort((a, b) => b.datum.localeCompare(a.datum));
  if (!list.length) {
    main.append(el('p', { class: 'empty', text: 'Nog geen ervaringen. Voeg er een toe zodra een atleet toestemming geeft.' }));
    return;
  }
  main.append(el('ul', { class: 'item-list boxed' }, list.map((r) => {
    const off = r.hidden || !r.tekst.trim();
    return el('li', { class: `item-row${off ? ' is-hidden' : ''}` }, [
      el('button', { type: 'button', class: 'item-main', onclick: () => editReview(r) }, [
        el('span', { class: 'item-top' }, [
          el('strong', { text: r.naam || '(naamloos)' }),
          r.afstand ? badge(r.afstand) : null,
          r.uitgelicht ? badge('Uitgelicht', 'hot') : null,
          r.hidden ? badge('Verborgen') : !r.tekst.trim() ? badge('Nog geen tekst') : badge('Zichtbaar', 'ok'),
        ]),
        el('small', { text: nlDate(r.datum) }),
        r.tekst ? el('small', { class: 'clamp', text: r.tekst }) : null,
      ]),
      el('div', { class: 'row-actions' }, [
        toggle('Uitgelicht', r.uitgelicht, (v) => { r.uitgelicht = v; changed({ rerender: false }); }),
      ]),
    ]);
  })));
}

function editReview(r) {
  openForm({
    title: r ? 'Ervaring bewerken' : 'Nieuwe ervaring',
    fields: [
      { key: 'naam', label: 'Voornaam', value: r?.naam, placeholder: 'bijv. Karl' },
      { key: 'afstand', label: 'Doel of afstand', type: 'select', value: r?.afstand || '', options: AFSTAND_OPTIONS },
      { key: 'datum', label: 'Datum', type: 'date', value: r?.datum || todayIso() },
      { key: 'tekst', label: 'Tekst', type: 'textarea', tall: true, value: r?.tekst, help: 'In de woorden van de atleet. Leeg = nog niet zichtbaar op de site.' },
      { key: 'uitgelicht', label: 'Uitgelicht op de homepage', type: 'checkbox', value: r?.uitgelicht },
      { key: 'hidden', label: 'Verbergen op de website', type: 'checkbox', value: r?.hidden },
    ],
    submitText: r ? 'Opslaan' : 'Toevoegen',
    onSave: (v) => {
      if (!v.naam) return 'Vul een voornaam in.';
      if (r) Object.assign(r, v);
      else state.doc.reviews.unshift({ id: uid('rev'), ...v });
      changed();
    },
    onDelete: r ? async () => {
      if (!(await confirmBox(`Ervaring van ${r.naam} verwijderen?`, { okText: 'Verwijderen', danger: true }))) return;
      state.doc.reviews.splice(state.doc.reviews.indexOf(r), 1);
      registreerVerwijderd(r);
      changed();
      toast('Ervaring verwijderd');
    } : null,
  });
}

/* ================================================= diensten & afstanden tab */

const ICON_OPTIONS = DIENST_ICONS.map((i) => ({ value: i, label: { zwem: 'Zwemmen', fiets: 'Fietsen', loop: 'Lopen' }[i] }));

function renderDienstenTab(main) {
  const doc = state.doc;
  main.append(el('div', { class: 'list-head' }, [el('h2', { text: 'Diensten' }), el('span', { class: 'muted small', text: 'Prijzen staan als tekst ("Op aanvraag").' })]));
  main.append(el('ul', { class: 'item-list boxed' }, doc.diensten.map((d, i) => el('li', { class: `item-row${d.hidden ? ' is-hidden' : ''}` }, [
    el('button', { type: 'button', class: 'item-main', onclick: () => editDienst(d) }, [
      el('span', { class: 'item-top' }, [el('strong', { text: d.titel || '(naamloos)' }), d.hidden ? badge('Verborgen') : null, el('span', { class: 'item-price', text: d.prijsTekst })]),
      el('small', { class: 'clamp', text: d.kort }),
    ]),
    el('div', { class: 'row-actions' }, [
      iconBtn('Omhoog', '↑', () => { move(doc.diensten, i, -1); changed(); }, i === 0 ? 'off' : ''),
      iconBtn('Omlaag', '↓', () => { move(doc.diensten, i, 1); changed(); }, i === doc.diensten.length - 1 ? 'off' : ''),
    ]),
  ]))));
  main.append(el('button', { type: 'button', class: 'add-row', text: '+ Dienst toevoegen', onclick: () => editDienst(null) }));
  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: 'Prijzen' }),
    field('Tekst onder de diensten', bound(doc, 'prijsIntro', { textarea: true }), 'Staat op de dienstenpagina.'),
  ]));
  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: 'Voorbeeldanalyse (zwemanalysepagina)' }),
    field('Link naar de viewer', bound(doc, 'voorbeeldAnalyseUrl'), 'De link opent in een nieuw tabblad. Leeg = geen voorbeeld tonen. Let op de vervaldatum van de link.'),
  ]));

  main.append(el('div', { class: 'list-head spaced' }, [el('h2', { text: 'Afstanden (racepagina)' })]));
  main.append(el('ul', { class: 'item-list boxed' }, doc.afstanden.map((a, i) => el('li', { class: 'item-row' }, [
    el('button', { type: 'button', class: 'item-main', onclick: () => editAfstand(a) }, [
      el('span', { class: 'item-top' }, [el('strong', { text: a.naam || '(naamloos)' }), a.weken ? badge(a.weken) : null]),
      el('small', { text: [a.zwem, a.fiets, a.loop].filter(Boolean).join(' · ') }),
    ]),
    el('div', { class: 'row-actions' }, [
      iconBtn('Omhoog', '↑', () => { move(doc.afstanden, i, -1); changed(); }, i === 0 ? 'off' : ''),
      iconBtn('Omlaag', '↓', () => { move(doc.afstanden, i, 1); changed(); }, i === doc.afstanden.length - 1 ? 'off' : ''),
    ]),
  ]))));
  main.append(el('button', { type: 'button', class: 'add-row', text: '+ Afstand toevoegen', onclick: () => editAfstand(null) }));

  main.append(el('div', { class: 'list-head spaced' }, [el('h2', { text: 'Waar sta je? (homepage)' })]));
  main.append(el('ul', { class: 'item-list boxed' }, doc.startpunten.map((s, i) => el('li', { class: 'item-row' }, [
    el('button', { type: 'button', class: 'item-main', onclick: () => editStartpunt(s) }, [
      el('span', { class: 'item-top' }, [el('strong', { text: s.titel || '(naamloos)' }), badge(s.link)]),
      el('small', { class: 'clamp', text: s.tekst }),
    ]),
    el('div', { class: 'row-actions' }, [
      iconBtn('Omhoog', '↑', () => { move(doc.startpunten, i, -1); changed(); }, i === 0 ? 'off' : ''),
      iconBtn('Omlaag', '↓', () => { move(doc.startpunten, i, 1); changed(); }, i === doc.startpunten.length - 1 ? 'off' : ''),
    ]),
  ]))));
  main.append(el('button', { type: 'button', class: 'add-row', text: '+ Startpunt toevoegen', onclick: () => editStartpunt(null) }));
}

function editDienst(d) {
  openForm({
    title: d ? 'Dienst bewerken' : 'Nieuwe dienst',
    fields: [
      { key: 'titel', label: 'Naam', value: d?.titel, placeholder: 'bijv. Zwemanalyse' },
      { key: 'icon', label: 'Icoon', type: 'select', value: d?.icon || 'loop', options: ICON_OPTIONS },
      { key: 'kort', label: 'Korte tekst (homepage)', type: 'textarea', value: d?.kort },
      { key: 'lang', label: 'Uitgebreide tekst (dienstenpagina)', type: 'textarea', tall: true, value: d?.lang },
      { key: 'voorWie', label: 'Voor wie (één regel per punt)', type: 'textarea', value: (d?.voorWie || []).join('\n') },
      { key: 'watJeKrijgt', label: 'Wat je krijgt (één regel per punt)', type: 'textarea', value: (d?.watJeKrijgt || []).join('\n') },
      { key: 'prijsTekst', label: 'Prijs (tekst)', value: d?.prijsTekst || 'Op aanvraag' },
      { key: 'hidden', label: 'Verbergen op de website', type: 'checkbox', value: d?.hidden },
    ],
    submitText: d ? 'Opslaan' : 'Toevoegen',
    onSave: (v) => {
      if (!v.titel) return 'Geef de dienst een naam.';
      const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
      const vals = { ...v, voorWie: lines(v.voorWie), watJeKrijgt: lines(v.watJeKrijgt), prijsTekst: v.prijsTekst || 'Op aanvraag' };
      if (d) Object.assign(d, vals);
      else state.doc.diensten.push({ id: uid('dienst'), ...vals });
      changed();
    },
    onDelete: d ? () => { state.doc.diensten.splice(state.doc.diensten.indexOf(d), 1); registreerVerwijderd(d); changed(); } : null,
  });
}

function editAfstand(a) {
  openForm({
    title: a ? 'Afstand bewerken' : 'Nieuwe afstand',
    fields: [
      { key: 'naam', label: 'Naam', value: a?.naam, placeholder: 'bijv. 1/4 triathlon' },
      { key: 'zwem', label: 'Zwemmen', value: a?.zwem, placeholder: '1000 m' },
      { key: 'fiets', label: 'Fietsen', value: a?.fiets, placeholder: '40 km' },
      { key: 'loop', label: 'Lopen', value: a?.loop, placeholder: '10 km' },
      { key: 'weken', label: 'Voorbereiding', value: a?.weken, placeholder: '12 tot 16 weken' },
      { key: 'voorWie', label: 'Voor wie / wat verandert er', type: 'textarea', tall: true, value: a?.voorWie },
    ],
    submitText: a ? 'Opslaan' : 'Toevoegen',
    onSave: (v) => {
      if (!v.naam) return 'Geef de afstand een naam.';
      if (a) Object.assign(a, v);
      else state.doc.afstanden.push({ id: uid('afst'), ...v });
      changed();
    },
    onDelete: a ? () => { state.doc.afstanden.splice(state.doc.afstanden.indexOf(a), 1); registreerVerwijderd(a); changed(); } : null,
  });
}

const LINK_OPTIONS = [
  { value: 'race.html', label: 'Begeleiding naar je race' },
  { value: 'diensten.html#schemas', label: 'Trainingsschema\'s' },
  { value: 'zwemanalyse.html', label: 'Zwemanalyse' },
  { value: 'diensten.html', label: 'Alle diensten' },
  { value: 'contact.html', label: 'Contact' },
];

function editStartpunt(s) {
  openForm({
    title: s ? 'Startpunt bewerken' : 'Nieuw startpunt',
    fields: [
      { key: 'titel', label: 'Titel', value: s?.titel, placeholder: 'Ik wil mijn eerste triathlon doen' },
      { key: 'tekst', label: 'Tekst', type: 'textarea', value: s?.tekst },
      { key: 'link', label: 'Linkt naar', type: 'select', value: s?.link || 'diensten.html', options: LINK_OPTIONS },
      { key: 'knop', label: 'Knoptekst', value: s?.knop, placeholder: 'bijv. Begeleiding naar je race' },
    ],
    submitText: s ? 'Opslaan' : 'Toevoegen',
    onSave: (v) => {
      if (!v.titel) return 'Vul een titel in.';
      if (s) Object.assign(s, v);
      else state.doc.startpunten.push({ id: uid('sp'), ...v });
      changed();
    },
    onDelete: s ? () => { state.doc.startpunten.splice(state.doc.startpunten.indexOf(s), 1); registreerVerwijderd(s); changed(); } : null,
  });
}

/* ======================================================= resultaten tab */

function renderResultatenTab(main) {
  const doc = state.doc;
  main.append(el('div', { class: 'list-head' }, [el('h2', { text: 'Resultaten' }), el('span', { class: 'muted small', text: 'Feiten uit Garmin/Strava. Staan op de homepage en bij "Over Ryan".' })]));
  main.append(el('ul', { class: 'item-list boxed' }, doc.resultaten.map((r, i) => el('li', { class: `item-row${r.hidden ? ' is-hidden' : ''}` }, [
    el('button', { type: 'button', class: 'item-main', onclick: () => editResultaat(r) }, [
      el('span', { class: 'item-top' }, [el('strong', { text: r.label || '(naamloos)' }), r.hidden ? badge('Verborgen') : null, el('span', { class: 'item-price', text: r.waarde })]),
      el('small', { text: r.datum ? formatDatum(r.datum) : 'zonder datum' }),
    ]),
    el('div', { class: 'row-actions' }, [
      iconBtn('Omhoog', '↑', () => { move(doc.resultaten, i, -1); changed(); }, i === 0 ? 'off' : ''),
      iconBtn('Omlaag', '↓', () => { move(doc.resultaten, i, 1); changed(); }, i === doc.resultaten.length - 1 ? 'off' : ''),
    ]),
  ]))));
  main.append(el('button', { type: 'button', class: 'add-row', text: '+ Resultaat toevoegen', onclick: () => editResultaat(null) }));
  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: 'Noot onder de resultaten' }),
    field('Tekst', bound(doc, 'resultatenNoot', { textarea: true }), 'Bijvoorbeeld de bron van de cijfers en je clubs.'),
  ]));

  main.append(el('div', { class: 'list-head spaced' }, [el('h2', { text: 'Waarom Ryan (drie punten op de homepage)' })]));
  main.append(el('ul', { class: 'item-list boxed' }, doc.usps.map((u, i) => el('li', { class: 'item-row' }, [
    el('button', { type: 'button', class: 'item-main', onclick: () => editUsp(u) }, [
      el('span', { class: 'item-top' }, [el('strong', { text: u.titel || '(naamloos)' })]),
      el('small', { class: 'clamp', text: u.tekst }),
    ]),
    el('div', { class: 'row-actions' }, [
      iconBtn('Omhoog', '↑', () => { move(doc.usps, i, -1); changed(); }, i === 0 ? 'off' : ''),
      iconBtn('Omlaag', '↓', () => { move(doc.usps, i, 1); changed(); }, i === doc.usps.length - 1 ? 'off' : ''),
    ]),
  ]))));
  main.append(el('button', { type: 'button', class: 'add-row', text: '+ Punt toevoegen', onclick: () => editUsp(null) }));
}

function editResultaat(r) {
  openForm({
    title: r ? 'Resultaat bewerken' : 'Nieuw resultaat',
    fields: [
      { key: 'label', label: 'Wat', value: r?.label, placeholder: 'bijv. Marathon Rotterdam' },
      { key: 'waarde', label: 'Tijd of resultaat', value: r?.waarde, placeholder: 'bijv. 3:30:08 of Gefinisht' },
      { key: 'datum', label: 'Maand', type: 'month', value: r?.datum ? r.datum.slice(0, 7) : '', help: 'Leeg laten mag.' },
      { key: 'hidden', label: 'Verbergen op de website', type: 'checkbox', value: r?.hidden },
    ],
    submitText: r ? 'Opslaan' : 'Toevoegen',
    onSave: (v) => {
      if (!v.label) return 'Vul in wat het resultaat is.';
      if (!v.waarde) return 'Vul een tijd of resultaat in.';
      if (r) Object.assign(r, v);
      else state.doc.resultaten.push({ id: uid('res'), ...v });
      changed();
    },
    onDelete: r ? () => { state.doc.resultaten.splice(state.doc.resultaten.indexOf(r), 1); registreerVerwijderd(r); changed(); } : null,
  });
}

function editUsp(u) {
  openForm({
    title: u ? 'Punt bewerken' : 'Nieuw punt',
    fields: [
      { key: 'titel', label: 'Titel', value: u?.titel, placeholder: 'bijv. Ik doe het zelf' },
      { key: 'tekst', label: 'Tekst', type: 'textarea', value: u?.tekst },
    ],
    submitText: u ? 'Opslaan' : 'Toevoegen',
    onSave: (v) => {
      if (!v.titel) return 'Vul een titel in.';
      if (u) Object.assign(u, v);
      else state.doc.usps.push({ id: uid('usp'), ...v });
      changed();
    },
    onDelete: u ? () => { state.doc.usps.splice(state.doc.usps.indexOf(u), 1); registreerVerwijderd(u); changed(); } : null,
  });
}

/* ===================================================== verhaal & FAQ tab */

function bound(obj, key, { textarea = false, placeholder = '', type = 'text', tall = false } = {}) {
  return el(textarea ? 'textarea' : 'input', {
    type: textarea ? null : type, rows: textarea ? 3 : null, class: tall ? 'tall' : null, placeholder, value: obj[key] ?? '',
    oninput: (e) => { obj[key] = e.target.value; changed({ rerender: false }); },
  });
}

/** Paneel met tekstregels die elk een id hebben ({id, tekst}), zodat "Samenvoegen" ze herkent. */
function linesPanel(title, help, list, prefix, { textarea = false, addText = '+ Regel toevoegen' } = {}) {
  const wrap = el('div', { class: 'pairs' });
  const draw = () => {
    clear(wrap);
    list.forEach((row, i) => wrap.append(el('div', { class: 'pair stacked', style: { gridTemplateColumns: '1fr auto auto' } }, [
      bound(row, 'tekst', { placeholder: 'Tekst', textarea, tall: textarea }),
      iconBtn('Omhoog', '↑', () => { move(list, i, -1); changed({ rerender: false }); draw(); }, i === 0 ? 'off' : ''),
      iconBtn('Verwijderen', '✕', () => { registreerVerwijderd(row); list.splice(i, 1); changed({ rerender: false }); draw(); }),
    ])));
    wrap.append(el('button', {
      type: 'button', class: 'add-row small', text: addText,
      onclick: () => { list.push({ id: uid(prefix), tekst: '' }); changed({ rerender: false }); draw(); wrap.querySelector('.pair:last-of-type input, .pair:last-of-type textarea')?.focus(); },
    }));
  };
  draw();
  return el('section', { class: 'panel' }, [el('h3', { text: title }), help ? el('p', { class: 'muted small', text: help }) : null, wrap]);
}

function faqPanel(list) {
  const wrap = el('div', { class: 'pairs' });
  const draw = () => {
    clear(wrap);
    list.forEach((row, i) => wrap.append(el('div', { class: 'pair stacked' }, [
      bound(row, 'vraag', { placeholder: 'Vraag' }),
      iconBtn('Omhoog', '↑', () => { move(list, i, -1); changed({ rerender: false }); draw(); }, i === 0 ? 'off' : ''),
      iconBtn('Verwijderen', '✕', () => { registreerVerwijderd(row); list.splice(i, 1); changed({ rerender: false }); draw(); }),
      bound(row, 'antwoord', { textarea: true, placeholder: 'Antwoord' }),
    ])));
    wrap.append(el('button', {
      type: 'button', class: 'add-row small', text: '+ Vraag toevoegen',
      onclick: () => { list.push({ id: uid('faq'), vraag: '', antwoord: '' }); changed({ rerender: false }); draw(); wrap.querySelector('.pair:last-of-type input')?.focus(); },
    }));
  };
  draw();
  return el('section', { class: 'panel' }, [el('h3', { text: 'Veelgestelde vragen' }), el('p', { class: 'muted small', text: 'Staan op de werkwijze-, race- en contactpagina.' }), wrap]);
}

function werkwijzePanel(list) {
  const wrap = el('div', { class: 'pairs' });
  const draw = () => {
    clear(wrap);
    list.forEach((row, i) => {
      row.stap = i + 1;
      wrap.append(el('div', { class: 'pair stacked' }, [
        bound(row, 'titel', { placeholder: `Stap ${i + 1}, bijv. Kennismaking` }),
        iconBtn('Omhoog', '↑', () => { move(list, i, -1); changed({ rerender: false }); draw(); }, i === 0 ? 'off' : ''),
        iconBtn('Verwijderen', '✕', () => { registreerVerwijderd(row); list.splice(i, 1); changed({ rerender: false }); draw(); }),
        bound(row, 'tekst', { textarea: true, placeholder: 'Wat gebeurt er in deze stap?' }),
      ]));
    });
    wrap.append(el('button', {
      type: 'button', class: 'add-row small', text: '+ Stap toevoegen',
      onclick: () => { list.push({ id: uid('ww'), stap: list.length + 1, titel: '', tekst: '' }); changed({ rerender: false }); draw(); wrap.querySelector('.pair:last-of-type input')?.focus(); },
    }));
  };
  draw();
  return el('section', { class: 'panel' }, [el('h3', { text: 'Werkwijze' }), el('p', { class: 'muted small', text: 'De eerste vier stappen staan op de homepage, alle stappen op de werkwijzepagina.' }), wrap]);
}

function renderVerhaalTab(main) {
  const doc = state.doc;
  main.append(
    linesPanel('Mijn verhaal', 'Alinea\'s op "Over Ryan". De eerste alinea staat ook als teaser op de homepage.', doc.verhaal, 'vh', { textarea: true, addText: '+ Alinea toevoegen' }),
    el('section', { class: 'panel' }, [
      el('h3', { text: 'Clubs en achtergrond' }),
      field('Tekst', bound(doc, 'clubsTekst', { textarea: true }), 'Blok onderaan "Over Ryan": je clubs en je achtergrond.'),
      field('Wat ik niet ben', bound(doc, 'clubsDisclaimer', { textarea: true }), 'Bijvoorbeeld: geen fysiotherapeut, geen diëtist.'),
    ]),
    werkwijzePanel(doc.werkwijze),
    linesPanel('Wat ik van jou verwacht', 'Lijst op de werkwijzepagina.', doc.verwachtingen, 'vw'),
    faqPanel(doc.faq),
  );
}

/* ============================================================== info tab */

function renderInfoTab(main) {
  const { info, hero } = state.doc;
  main.append(
    el('section', { class: 'panel' }, [
      el('h3', { text: 'Homepage' }),
      field('Kop', bound(hero, 'kop', { placeholder: 'Je eerste triathlon? Ik help je er komen.' })),
      field('Tekst onder de kop', bound(hero, 'sub', { textarea: true })),
      field('Knop (WhatsApp)', bound(hero, 'ctaPrimair', { placeholder: 'Plan een kennismaking' })),
      field('Tweede knop', bound(hero, 'ctaSecundair', { placeholder: 'Bekijk de diensten' })),
      field('Mededeling bovenaan', bound(info, 'announcement', { placeholder: 'bijv. Plek vrij vanaf januari' }), 'Leeg = geen mededeling. Handig voor tijdelijke berichten.'),
    ]),
    el('section', { class: 'panel' }, [
      el('h3', { text: 'Algemeen' }),
      field('Naam', bound(info, 'name')),
      field('Tagline', bound(info, 'tagline', { placeholder: 'Je hoeft het niet alleen uit te zoeken.' }), 'Staat in de footer van elke pagina.'),
      field('Regio', bound(info, 'regio', { placeholder: 'Rotterdam en omgeving' })),
    ]),
    el('section', { class: 'panel' }, [
      el('h3', { text: 'Contact' }),
      field('WhatsApp', bound(info, 'whatsapp', { placeholder: '06-12345678' }), 'Wordt de WhatsApp-knop op elke pagina. Zonder nummer wijst de knop naar het formulier.'),
      field('Telefoon', bound(info, 'phone', { placeholder: '06-12345678' }), 'Leeg = zelfde als WhatsApp.'),
      field('E-mail', bound(info, 'email', { placeholder: 'ryan@ryantricoaching.nl' })),
      field('KvK-nummer', bound(info, 'kvk'), 'Leeg = niet tonen.'),
      field('Instagram', bound(info, 'instagram', { placeholder: 'gebruikersnaam of volledige link' })),
      field('Strava', bound(info, 'strava', { placeholder: 'https://www.strava.com/athletes/…' })),
      field('Facebook', bound(info, 'facebook')),
      field('LinkedIn', bound(info, 'linkedin', { placeholder: 'https://www.linkedin.com/in/…' })),
    ]),
  );
}

/* ========================================================== settings tab */

function renderSettingsTab(main) {
  const demo = !!state.session.demo;
  const siteUrl = new URL('./', location.href).href;
  const owner = state.gistOwner || state.session.login || '';
  const needsConfig = !demo && state.gistId && (CONFIG.gistId !== state.gistId || (owner && CONFIG.gistOwner !== owner));

  if (needsConfig) {
    const line = `  gistId: '${state.gistId}',\n  gistOwner: '${owner}',`;
    main.append(el('section', { class: 'panel attention' }, [
      el('h3', { text: 'Nog één ding: bezoekers zien de Gist nog niet' }),
      el('p', { text: 'Op dit apparaat leest de site al uit je Gist, maar voor bezoekers moet hij nog in de code staan. Zet deze regels in assets/js/config.js en push:' }),
      el('pre', { class: 'code', text: line }),
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Kopieer regels', onclick: () => copy(line) }),
    ]));
  }

  const versie = document.querySelector('meta[name="version"]')?.content || '';
  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: 'Opslag' }),
    demo
      ? el('p', { class: 'muted', text: 'Je zit in de demo. Alles staat in deze browser; de website toont de demogegevens alleen hier.' })
      : el('dl', { class: 'kv' }, [
        el('dt', { text: 'Ingelogd als' }), el('dd', { text: state.session.login || '—' }),
        el('dt', { text: 'Gist' }), el('dd', {}, [el('a', { href: `https://gist.github.com/${state.gistId}`, target: '_blank', rel: 'noopener', text: state.gistId })]),
        el('dt', { text: 'Laatst gepubliceerd' }), el('dd', { text: state.baseUpdatedAt ? new Date(state.baseUpdatedAt).toLocaleString('nl-NL') : '—' }),
        el('dt', { text: 'Versie site' }), el('dd', { text: versie || '—' }),
      ]),
    el('div', { class: 'btn-row' }, [
      el('a', { class: 'btn btn-ghost btn-sm', href: siteUrl, target: '_blank', rel: 'noopener', text: 'Website openen ↗' }),
      demo ? null : el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Opnieuw ophalen', onclick: reload }),
    ]),
  ]));

  if (!demo) {
    main.append(el('section', { class: 'panel' }, [
      el('h3', { text: 'Inloggen op je telefoon' }),
      el('p', { class: 'muted', text: 'Een link waarin je sleutel zit. Eén keer openen op je telefoon en je bent ingelogd. Deel hem met niemand: wie de link heeft, kan de site aanpassen.' }),
      el('button', {
        type: 'button', class: 'btn btn-ghost btn-sm', text: 'Kopieer beheerlink',
        onclick: () => copy(`${new URL('beheer.html', location.href).href}#k=${encodeURIComponent(state.session.token)}`),
      }),
    ]));
  }

  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: 'Back-up' }),
    el('p', { class: 'muted', text: 'Download alle gegevens als bestand, of zet een eerder bestand terug. Terugzetten wordt pas zichtbaar na publiceren.' }),
    el('div', { class: 'btn-row' }, [
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Download back-up', onclick: exportJson }),
      el('label', { class: 'btn btn-ghost btn-sm' }, [
        'Back-up terugzetten',
        el('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: importJson }),
      ]),
      el('button', {
        type: 'button', class: 'btn btn-ghost btn-sm', text: 'Standaardgegevens',
        onclick: async () => {
          if (!(await confirmBox('Alle gegevens vervangen door de standaardgegevens uit de website-code (data/site.json)?\n\nLet op: je eigen invullingen gaan verloren: teksten, telefoonnummer, ervaringen en resultaten. Wil je alleen nieuwe teksten erbij, gebruik dan "Nieuwe standaardteksten samenvoegen".', { okText: 'Ja, alles vervangen', danger: true }))) return;
          if (!(await confirmBox('Zeker weten? Dit is niet ongedaan te maken na publiceren. Download eerst een back-up als je twijfelt.', { okText: 'Vervangen', danger: true }))) return;
          state.doc = await bundledDoc();
          changed();
          renderShell();
        },
      }),
    ]),
  ]));

  main.append(el('section', { class: `panel${state.mergeHint ? ' attention' : ''}` }, [
    el('h3', { text: 'Nieuwe standaardteksten' }),
    el('p', { class: 'muted', text: 'Na een update van de website kunnen er nieuwe teksten in de code staan (bijvoorbeeld een FAQ-vraag of een afstand). Samenvoegen voegt alleen toe wat jij nog niet hebt en vult lege velden; wat je zelf invulde of verwijderde blijft zoals het is. Daarna gewoon publiceren.' }),
    el('div', { class: 'btn-row' }, [
      el('button', { type: 'button', class: 'btn btn-primary btn-sm', id: 'merge-btn', text: 'Nieuwe standaardteksten samenvoegen', onclick: samenvoegen }),
    ]),
  ]));

  main.append(el('section', { class: 'panel' }, [
    el('h3', { text: demo ? 'Demo' : 'Afmelden' }),
    el('button', {
      type: 'button', class: 'btn btn-danger btn-sm',
      text: demo ? 'Demo verlaten en gegevens wissen' : 'Uitloggen op dit apparaat',
      onclick: logout,
    }),
  ]));
}

const LIJST_LABEL = { startpunten: 'startpunt', diensten: 'dienst', afstanden: 'afstand', usps: 'punt "Waarom Ryan"', resultaten: 'resultaat', werkwijze: 'werkwijze-stap', verwachtingen: 'verwachting', verhaal: 'alinea', faq: 'FAQ', reviews: 'ervaring' };
const VELD_LABEL = { tagline: 'tagline', regio: 'regio', strava: 'Strava', instagram: 'Instagram', 'hero.kop': 'kop homepage', 'hero.sub': 'tekst homepage', 'hero.ctaPrimair': 'knop homepage', 'hero.ctaSecundair': 'tweede knop homepage', prijsIntro: 'prijstekst', resultatenNoot: 'noot bij resultaten' };

async function samenvoegen() {
  let bundled;
  try { bundled = await bundledDoc(); } catch (err) { return toast(`Standaardgegevens niet te laden: ${errorText(err)}`, 'error', 6000); }
  const { doc, rapport } = mergeDefaults(state.doc, bundled);
  if (!rapport.toegevoegd.length && !rapport.ingevuld.length) return toast('Alles is al up-to-date.', 'ok', 4000);
  const ok = await rapportBox(rapport);
  if (!ok) return;
  state.doc = doc;
  state.mergeHint = false;
  changed();
  renderShell();
  toast(`${rapport.toegevoegd.length} toegevoegd, ${rapport.ingevuld.length} ingevuld. Controleer en publiceer.`, 'ok', 6000);
}

/** Toont wat Samenvoegen gaat doen; Toepassen of Annuleren. */
function rapportBox(rapport) {
  return new Promise((resolve) => {
    const dialog = $('#modal');
    const form = clear($('#modal-form'));
    const finish = (answer) => { dialog.removeEventListener('cancel', onCancel); dialog.close(); resolve(answer); };
    const onCancel = () => finish(false);
    const lijst = (titel, items) => (items.length ? [el('h3', { text: titel, style: { fontSize: '15px', marginTop: '8px' } }), el('ul', { class: 'rapport' }, items.map((t) => el('li', { text: t })))] : []);
    form.append(
      el('header', { class: 'modal-head' }, [el('h2', { text: 'Nieuwe standaardteksten' }), el('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Sluiten', text: '✕', onclick: () => finish(false) })]),
      el('div', { class: 'modal-body', id: 'merge-rapport' }, [
        el('p', { class: 'muted', text: 'Dit wordt toegevoegd; je eigen teksten blijven ongewijzigd.' }),
        ...lijst(`${rapport.toegevoegd.length} toe te voegen`, rapport.toegevoegd.map((t) => `${LIJST_LABEL[t.lijst] || t.lijst}: ${t.label}`)),
        ...lijst(`${rapport.ingevuld.length} leeg veld in te vullen`, rapport.ingevuld.map((v) => VELD_LABEL[v] || v)),
        rapport.overgeslagen.length ? el('p', { class: 'muted small', text: `${rapport.overgeslagen.length} eerder door jou verwijderd en daarom overgeslagen.` }) : null,
      ]),
      el('footer', { class: 'modal-foot' }, [
        el('span', { class: 'spacer' }),
        el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Annuleren', onclick: () => finish(false) }),
        el('button', { type: 'button', class: 'btn btn-primary btn-sm', text: 'Toepassen', onclick: () => finish(true) }),
      ]),
    );
    form.onsubmit = (e) => e.preventDefault();
    dialog.addEventListener('cancel', onCancel);
    if (!dialog.open) dialog.showModal();
  });
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Gekopieerd', 'ok');
  } catch {
    window.prompt('Kopieer:', text);
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.doc, null, 1)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `ryantricoaching-site-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importJson(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed?.diensten) || !parsed?.info) throw new Error('Dit bestand bevat geen website-gegevens.');
    state.doc = normalize(parsed);
    changed();
    renderShell();
    toast('Back-up geladen. Controleer en publiceer.', 'ok', 4000);
  } catch (err) {
    toast(`Kon het bestand niet lezen: ${err.message}`, 'error', 5000);
  }
}

async function reload() {
  if (isDirty() && !(await confirmBox('Je niet-gepubliceerde wijzigingen gaan verloren. Doorgaan?', { danger: true }))) return;
  storageSet(DRAFT_KEY, null);
  await openGistOrSetup();
}

async function logout() {
  if (isDirty() && !(await confirmBox('Je hebt niet-gepubliceerde wijzigingen. Toch afmelden?', { okText: 'Afmelden', danger: true }))) return;
  if (state.session?.demo) setDemoDoc(null);
  storageSet(SESSION_KEY, null);
  storageSet(DRAFT_KEY, null);
  state.session = null;
  state.doc = null;
  state.mergeHint = null;
  renderLogin();
}

/* ================================================================== boot */

window.addEventListener('beforeunload', (e) => {
  if (isDirty() && !state.session?.demo) e.preventDefault();
});

async function boot() {
  // Inloggen via een link: beheer.html#k=<sleutel>. Meteen uit de adresbalk halen.
  const hash = new URLSearchParams(location.hash.slice(1));
  const fromLink = hash.get('k');
  if (fromLink) history.replaceState(null, '', location.pathname + location.search);

  const saved = storageGet(SESSION_KEY);
  try {
    if (fromLink) return await login(fromLink);
    if (saved?.demo) return await startDemo({ fresh: false });
    if (saved?.token) {
      state.session = saved;
      return await openGistOrSetup();
    }
  } catch (err) {
    return renderLogin(errorText(err));
  }
  renderLogin();
}

boot();
