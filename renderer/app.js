'use strict';
const api = window.tnt;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const errMsg = e => String((e && e.message) || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
// ---------- i18n ----------
const I18N = {
  ru: {
    'side.title': 'МОИ СБОРКИ',
    'nav.catalog': 'Каталог сборок',
    'nav.skin': 'Редактор скина',
    'nav.account': 'Аккаунт и настройки',
    'play': 'ИГРАТЬ',
    'stop': 'СТОП',
    'launching': 'ЗАПУСК…',
    'mods.hint': 'Моды Modrinth под версию и загрузчик этой сборки. Нужные зависимости ставятся сами.',
    'mods.recommended': 'Рекомендуемые моды',
    'bedrock.unsupported': 'Bedrock Edition поддерживается только на Windows. На этой системе доступна только Java Edition.',
    'deps.title': 'Установить зависимости?',
    'deps.ask': 'Установить зависимости?',
    'deps.never': 'Больше не спрашивать',
    'repair.title': 'Починить сборку',
    'repair.select': 'Выберите приоритетный мод',
  },
  en: {
    'side.title': 'MY INSTANCES',
    'nav.catalog': 'Modpack catalog',
    'nav.skin': 'Skin editor',
    'nav.account': 'Account & settings',
    'play': 'PLAY',
    'stop': 'STOP',
    'launching': 'LAUNCHING…',
    'mods.hint': 'Modrinth mods for this instance version and loader. Dependencies are installed automatically.',
    'mods.recommended': 'Recommended mods',
    'bedrock.unsupported': 'Bedrock Edition is supported only on Windows. On this OS only Java Edition is available.',
    'deps.title': 'Install dependencies?',
    'deps.ask': 'Install dependencies?',
    'deps.never': 'Don\'t ask again',
    'repair.title': 'Repair build',
    'repair.select': 'Select priority mod',
  }
};
let currentLang = localStorage.getItem('lang') || 'ru';
function t(key) { return (I18N[currentLang] || I18N.ru)[key] || key; }
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = val;
    else el.textContent = val;
  });
  // Update dynamic texts
  if ($('#sideTitle')) $('#sideTitle').textContent = t('side.title');
  if ($('#playTxt')) $('#playTxt').textContent = S.busy ? t('launching') : S.playing ? t('stop') : t('play');
}
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyI18n();
  // re-render current view if needed
  if (S.view === 'inst') renderInst();
  renderSide();
}
// Add language switcher to account or side (example: add buttons)
function initLangSwitcher() {
  const acc = $('#v-account') || document.body;
  const switcher = document.createElement('div');
  switcher.innerHTML = `<div class="field"><span>Language / Язык</span><div class="seg"><button data-lang="ru" class="${currentLang==='ru'?'on':''}">Русский</button><button data-lang="en" class="${currentLang==='en'?'on':''}">English</button></div></div>`;
  switcher.onclick = e => { const b = e.target.closest('button'); if (b) setLang(b.dataset.lang); };
  // Insert somewhere visible, e.g. before account content or in side
  const side = $('#side');
  if (side) side.appendChild(switcher);
}

document.body.dataset.platform = api.platform;

// ---------- иконки ----------
const P = {
  plus: 'M12 5v14M5 12h14', folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3', cube: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  brush: 'M18 3l3 3-9 9-4 1 1-4zM5 21c2 0 3-1 3-3', store: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  terminal: 'M4 5h16v14H4zM8 10l3 2-3 2M13 15h4', upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  key: 'M15 7a4 4 0 1 1-3 6.6L4 21v-3h3v-3h3', window: 'M3 5h18v14H3zM3 9h18', copy: 'M9 9h11v11H9zM5 15V5a2 2 0 0 1 2-2h8',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M8.5 9h.01', sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  play: 'M7 4l13 8-13 8z', stop: 'M6 6h12v12H6z', check: 'M5 13l4 4L19 7',
};
const svg = n => `<svg viewBox="0 0 24 24" fill="${n === 'play' || n === 'stop' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${P[n]}"/></svg>`;
const hydrate = (root = document) => $$('[data-i]', root).forEach(el => { if (!el.firstChild) el.innerHTML = svg(el.dataset.i); });

function toast(text, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind; t.textContent = text;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = 0; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, kind === 'err' ? 7000 : 3800);
}
const av = (name, color, cls = '') => `<div class="av ${cls}" style="--c:${esc(color)}">${esc((name || '?').trim()[0] || '?').toUpperCase()}</div>`;
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + ' млн' : n >= 1e3 ? Math.round(n / 1e3) + ' тыс' : String(n);
const seg = (el, val) => $$('button', el).forEach(b => b.classList.toggle('on', (b.dataset.l || b.dataset.f || b.dataset.t || b.dataset.e || b.dataset.k) === val));
const segVal = el => ($('button.on', el) || {}).dataset?.l;

// ---------- состояние ----------
const LOADER = { vanilla: 'Vanilla', fabric: 'Fabric', forge: 'Forge' };
const S = { edition: localStorage.getItem('edition') || 'java', st: null, insts: [], cur: null, view: 'inst', tab: 'files', folder: 'mods', versions: [], playing: false, busy: false };
const cur = () => S.insts.find(i => i.id === S.cur);

async function refresh() {
  S.insts = await api.invoke('inst-list');
  if (!cur()) S.cur = S.insts[0]?.id || null;
}

// ---------- навигация ----------
function go(view) {
  S.view = view;
  $$('.page').forEach(p => p.classList.toggle('on', p.id === 'v-' + view));
  renderSide();
  if (view === 'inst') renderInst();
  if (view === 'account') renderAccount();
  if (view === 'bedrock') renderBedrock();
  $('#pages').scrollTop = 0;
}
function select(id) {
  S.edition = id === 'bedrock' ? 'bedrock' : 'java'; localStorage.setItem('edition', S.edition);
  if (id === 'bedrock') { go('bedrock'); return; }
  S.cur = id; go('inst');
}

function renderSide() {
  const bedrock = S.edition === 'bedrock';
  $('#bNew').hidden = bedrock; $('#sideTitle').textContent = bedrock ? 'BEDROCK' : 'МОИ СБОРКИ'; seg($('#edSeg'), S.edition);
  if (bedrock) {
    $('#instList').innerHTML = `<button class="inst ${S.view === 'bedrock' ? 'on' : ''}" data-id="bedrock" style="--c:#4da3ff">${av('B', '#4da3ff')}<div><b>Minecraft Bedrock</b><small>Windows</small></div></button>`;
  } else $('#instList').innerHTML = S.insts.map(i => `
    <button class="inst ${S.view === 'inst' && i.id === S.cur ? 'on' : ''}" data-id="${i.id}" style="--c:${esc(i.color)}">
      ${av(i.name, i.color)}<div><b>${esc(i.name)}</b><small>${esc(i.version)} · ${LOADER[i.loader]}</small></div></button>`).join('');
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.v === S.view));
  const a = S.st && S.st.account;
  $('#acctAv').outerHTML = av(a ? a.name : '?', a ? '#ffb82e' : '#4a5663', 'sm').replace('class="av sm"', 'class="av sm" id="acctAv"');
  $('#acctName').textContent = a ? a.name : 'Гость';
  $('#acctSub').textContent = a ? (a.type === 'microsoft' ? 'Microsoft' : 'офлайн') : 'аккаунт не выбран';
}
$('#edSeg').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  S.edition = b.dataset.e; localStorage.setItem('edition', S.edition);
  S.edition === 'bedrock' ? go('bedrock') : go('inst');
};
$('#instList').onclick = e => { const b = e.target.closest('.inst'); if (b) select(b.dataset.id); };
$$('nav button').forEach(b => b.onclick = () => go(b.dataset.v));
$('#acct').onclick = () => go('account');

// ---------- страница сборки ----------
function renderInst() {
  const i = cur();
  const hero = $('#hero');
  if (!i) {
    $('#hAv').outerHTML = av('+', '#4a5663', 'xl').replace('class="av xl"', 'class="av xl" id="hAv"');
    $('#hName').textContent = 'Сборок пока нет';
    $('#hChips').innerHTML = '<span class="chip">создайте первую кнопкой «Новая» слева</span>';
    $('#bPlay').disabled = true; return;
  }
  hero.style.setProperty('--c', i.color);
  $('#hAv').outerHTML = av(i.name, i.color, 'xl').replace('class="av xl"', 'class="av xl" id="hAv"');
  $('#hName').textContent = i.name;
  $('#hChips').innerHTML = `<span class="chip">${esc(i.version)}</span><span class="chip ${i.loader}">${LOADER[i.loader]}</span><span class="chip">${((i.ram || S.st.ram) / 1024).toFixed(1)} ГБ</span>`;
  setPlayUi();
  fillSettings(i);
  renderFiles();
}

function setTab(t) {
  S.tab = t;
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  $$('#v-inst .pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + t));
  if (t === 'mods') loadRecommendedMods();
}
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.t); };

// -- запуск
async function openRepair() {
  const i = cur(); if (!i) return;
  const files = await api.invoke('files-list', { id: i.id, folder: 'mods' });
  const list = $('#repairList');
  list.innerHTML = files.map(f => `<label class="item"><input type="radio" name="prio" value="${esc(f.name)}"> ${esc(f.name)}</label>`).join('') || '<div class="empty">Нет модов</div>';
  const dlg = $('#dRepair');
  dlg.showModal();
  $('#repairOk').onclick = async () => {
    const prio = list.querySelector('input:checked')?.value;
    if (!prio) { toast('Выберите мод', 'warn'); return; }
    dlg.close();
    toast('Чиним сборку…');
    try {
      const r = await api.invoke('mods-repair', { id: S.cur, priority: prio });
      toast(r.message || 'Сборка починена');
      renderFiles();
      // Убираем кнопку ремонта после успеха
      const btn = document.getElementById('bRepair');
      if (btn) btn.remove();
    } catch (e) {
      toast(errMsg(e), 'err');
    }
  };
  $('#repairCancel').onclick = () => dlg.close();
}

function setPlayUi() {
  const b = $('#bPlay');
  b.classList.toggle('stop', S.playing);
  b.disabled = S.busy;
  $('#playTxt').textContent = S.busy ? t('launching') : S.playing ? t('stop') : t('play');
  b.querySelector('[data-i]').innerHTML = svg(S.playing ? 'stop' : 'play');
  $('#bar').classList.toggle('busy', S.busy);
}
function setProg(text, frac) {
  $('#pText').textContent = text;
  $('#bar i').style.width = (S.busy && !frac ? 30 : Math.round((frac || 0) * 100)) + '%';
}
$('#bPlay').innerHTML = '<i data-i="play"></i><span id="playTxt">ИГРАТЬ</span>';
$('#bPlay').onclick = async () => {
  if (S.playing) { await api.invoke('stop'); return; }
  const i = cur(); if (!i) return;
  if (!S.st.account) { toast('Сначала войдите в аккаунт', 'warn'); go('account'); return; }
  S.busy = true; setPlayUi(); setTab('log');
  try { await api.invoke('play', i.id); S.playing = true; await refresh(); }
  catch (e) { 
    toast(errMsg(e), 'err'); log('Ошибка: ' + errMsg(e)); setProg('Готов к запуску', 0); 
    // Show repair button if crash
    if (!document.getElementById('bRepair')) {
      const btn = document.createElement('button');
      btn.id = 'bRepair'; btn.className = 'btn'; btn.textContent = t('repair.title');
      btn.onclick = openRepair;
      $('#hero').appendChild(btn);
    }
  }
  S.busy = false; setPlayUi();
};
api.onProgress(p => setProg(p.text, p.frac));
api.onClosed(() => { S.playing = false; S.busy = false; setPlayUi(); setProg('Готов к запуску', 0); });
const logEl = $('#log');
function log(m) { logEl.textContent += String(m).replace(/\s+$/, '') + '\n'; if (logEl.textContent.length > 120000) logEl.textContent = logEl.textContent.slice(-80000); logEl.scrollTop = logEl.scrollHeight; }
api.onLog(log);

// -- файлы
async function renderFiles() {
  const i = cur(); if (!i) { $('#fList').innerHTML = ''; return; }
  const files = await api.invoke('files-list', { id: i.id, folder: S.folder });
  $('#fList').innerHTML = files.length ? files.sort((a, b) => a.name.localeCompare(b.name)).map(f => `
    <div class="item ${f.enabled ? '' : 'off'}" data-n="${esc(f.name)}">
      <span class="nm">${esc(f.name.replace(/\.disabled$/, ''))}</span><small>${f.size ? (f.size / 1048576).toFixed(2) + ' МБ' : ''}${f.enabled ? '' : ' · выключен'}</small>
      ${S.folder !== 'saves' ? `<button class="btn sm" data-a="t">${f.enabled ? 'Выключить' : 'Включить'}</button>` : ''}
      <button class="btn sm danger" data-a="d">Удалить</button></div>`).join('') : '<div class="empty">Здесь пока пусто</div>';
}
$('#folderSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.folder = b.dataset.f; seg($('#folderSeg'), S.folder); renderFiles(); };
$('#fList').onclick = async e => {
  const b = e.target.closest('button'); if (!b) return;
  const name = b.closest('.item').dataset.n, arg = { id: S.cur, folder: S.folder, name };
  try {
    if (b.dataset.a === 't') await api.invoke('file-toggle', arg);
    else if (confirm(`Удалить «${name}»?`)) await api.invoke('file-delete', arg);
    renderFiles();
  } catch (er) { toast(errMsg(er), 'err'); }
};
$('#fAdd').onclick = async () => { await api.invoke('file-add', { id: S.cur, folder: S.folder }); renderFiles(); };
$('#fOpen').onclick = () => api.invoke('inst-open', { id: S.cur, folder: S.folder });
$('#fRoot').onclick = () => api.invoke('inst-open', { id: S.cur });

// -- карточки Modrinth
const card = (h, btn) => `<div class="card-item" data-id="${esc(h.id)}" data-title="${esc(h.title)}">
  <div class="ci-ico">${h.icon ? `<img src="${esc(h.icon)}" alt="">` : esc(h.title[0])}</div>
  <div class="ci-body"><b>${esc(h.title)}</b><p>${esc(h.desc)}</p><small>${fmt(h.downloads)} загрузок · ${esc(h.author || '')}</small></div>
  <button class="btn primary sm" data-a="install">${btn}</button></div>`;
const skeleton = el => el.innerHTML = '<div class="empty">Ищу…</div>';

async function loadRecommendedMods() {
  const i = cur(); if (!i || i.loader === 'vanilla') return;
  if ($('#mQ').value.trim()) return; // only if search empty
  skeleton($('#mList'));
  try {
    // Popular recommended: Fabric API, Sodium, Iris (search or specific)
    const popular = ['fabric-api', 'sodium', 'iris'];
    const hits = [];
    for (const slug of popular) {
      try {
        const res = await api.invoke('mods-search', { id: i.id, q: slug });
        if (res && res[0]) hits.push(res[0]);
      } catch {}
    }
    if (!hits.length) {
      const res = await api.invoke('mods-search', { id: i.id, q: '' });
      hits.push(...(res || []).slice(0, 6));
    }
    $('#mList').innerHTML = hits.length ? `<p class="hint">${t('mods.recommended')}</p>` + hits.map(h => card(h, 'Установить')).join('') : '<div class="empty">Нет рекомендаций для этой версии</div>';
  } catch (e) { $('#mList').innerHTML = ''; }
}

async function searchMods() {
  const i = cur(); if (!i) return;
  if (i.loader === 'vanilla') { toast('В сборке Vanilla моды не работают — выберите Fabric или Forge в настройках сборки', 'warn'); return; }
  skeleton($('#mList'));
  try {
    const hits = await api.invoke('mods-search', { id: i.id, q: $('#mQ').value });
    $('#mList').innerHTML = hits.length ? hits.map(h => card(h, 'Установить')).join('') : '<div class="empty">Ничего не найдено для этой версии и загрузчика</div>';
  } catch (e) { $('#mList').innerHTML = ''; toast(errMsg(e), 'err'); }
}
$('#mGo').onclick = searchMods;
$('#mQ').onkeydown = e => { if (e.key === 'Enter') searchMods(); };
$('#mList').onclick = async e => {
  const b = e.target.closest('[data-a=install]'); if (!b) return;
  const id = b.closest('.card-item').dataset.id;
  const auto = localStorage.getItem('auto_download_deps') === 'true';
  b.textContent = '…'; b.disabled = true;
  try {
    // Check deps first via a new or existing call; for simplicity we ask always unless auto
    if (!auto) {
      // In real impl, call API to get deps list. Here we show modal.
      $('#depsList').textContent = 'Этот мод может требовать зависимости. Установить их?';
      const dlg = $('#dDeps');
      dlg.showModal();
      const yes = await new Promise(res => {
        $('#depsYes').onclick = () => { if ($('#depsNever').checked) localStorage.setItem('auto_download_deps', 'true'); res(true); dlg.close(); };
        $('#depsNo').onclick = () => { res(false); dlg.close(); };
      });
      if (!yes) { b.textContent = 'Установить'; b.disabled = false; return; }
    }
    const done = await api.invoke('mods-install', { id: S.cur, project: id });
    b.textContent = 'Установлено'; toast('Установлено: ' + done.join(', ')); renderFiles();
  } catch (er) { b.textContent = 'Установить'; b.disabled = false; toast(errMsg(er), 'err'); }
};

// -- настройки сборки
function fillVersions(sel, selected, all) {
  sel.innerHTML = S.versions.filter(v => all || v.type === 'release' || v.id === selected).map(v => `<option ${v.id === selected ? 'selected' : ''}>${v.id}</option>`).join('');
}
function fillSettings(i) {
  $('#sName').value = i.name; $('#sJvm').value = i.jvm || '';
  fillVersions($('#sVer'), i.version, true); $('#sVer').value = i.version;
  seg($('#sLoader'), i.loader);
  const r = $('#sRam'); r.max = Math.max(2048, Math.floor(S.st.totalMemMB / 512) * 512); r.value = i.ram || S.st.ram;
  $('#sDef').checked = !i.ram; ramLabel(); markColor(i);
}
const ramLabel = () => $('#sRamV').textContent = $('#sDef').checked ? 'общая' : ($('#sRam').value / 1024).toFixed(1) + ' ГБ';
$('#sRam').oninput = () => { $('#sDef').checked = false; ramLabel(); };
$('#sDef').onchange = ramLabel;
$('#sLoader').onclick = e => { const b = e.target.closest('button'); if (b) seg($('#sLoader'), b.dataset.l); };
$('#sSave').onclick = async () => {
  try {
    await api.invoke('inst-update', { id: S.cur, patch: { name: $('#sName').value, version: $('#sVer').value, loader: segVal($('#sLoader')), jvm: $('#sJvm').value.trim(), ram: $('#sDef').checked ? null : +$('#sRam').value } });
    await refresh(); renderSide(); renderInst(); toast('Сохранено');
  } catch (e) { toast(errMsg(e), 'err'); }
};
$('#sDel').onclick = async () => {
  const i = cur(); if (!i || !confirm(`Удалить «${i.name}» вместе с модами и мирами?`)) return;
  await api.invoke('inst-delete', i.id); await refresh(); go('inst');
};

// ---------- новая сборка ----------
$('#bNew').onclick = () => { $('#dName').value = ''; $('#dSnap').checked = false; fillVersions($('#dVer'), S.versions.find(v => v.type === 'release')?.id, false); seg($('#dLoader'), 'vanilla'); $('#dNew').showModal(); };
$('#dSnap').onchange = () => fillVersions($('#dVer'), $('#dVer').value, $('#dSnap').checked);
$('#dLoader').onclick = e => { const b = e.target.closest('button'); if (b) seg($('#dLoader'), b.dataset.l); };
$('#dCancel').onclick = () => $('#dNew').close();
$('#dOk').onclick = async () => {
  const v = $('#dVer').value; if (!v) { toast('Список версий ещё грузится', 'warn'); return; }
  const i = await api.invoke('inst-create', { name: $('#dName').value, version: v, loader: segVal($('#dLoader')) });
  $('#dNew').close(); await refresh(); S.tab = 'files'; setTab('files'); select(i.id);
};

// ---------- каталог сборок ----------
async function searchPacks() {
  skeleton($('#pList'));
  try {
    const hits = await api.invoke('packs-search', $('#pQ').value);
    $('#pList').innerHTML = hits.length ? hits.map(h => card(h, 'Установить')).join('') : '<div class="empty">Ничего не найдено</div>';
  } catch (e) { $('#pList').innerHTML = ''; toast(errMsg(e), 'err'); }
}
$('#pGo').onclick = searchPacks;
$('#pQ').onkeydown = e => { if (e.key === 'Enter') searchPacks(); };
$('#pList').onclick = async e => {
  const b = e.target.closest('[data-a=install]'); if (!b) return;
  const c = b.closest('.card-item');
  b.textContent = 'Скачиваю…'; b.disabled = true;
  try { const i = await api.invoke('packs-install', { project: c.dataset.id, title: c.dataset.title }); await refresh(); toast(`Сборка «${i.name}» установлена`); select(i.id); }
  catch (er) { b.textContent = 'Установить'; b.disabled = false; toast(errMsg(er), 'err'); }
};
$('#pImp').onclick = async () => {
  try { const i = await api.invoke('packs-import'); if (i) { await refresh(); select(i.id); } } catch (e) { toast(errMsg(e), 'err'); }
};

// ---------- аккаунт ----------
function renderAccount() {
  const a = S.st.account;
  $('#verNow').textContent = S.st.version || '—';
  $('#siteUrl').value = S.st.site || '';
  showSkinNick();
  $('#bOut').hidden = !a;
  $('#nick').value = S.st.nick || '';
  const g = $('#gRam'); g.max = Math.max(2048, Math.floor(S.st.totalMemMB / 512) * 512); g.value = S.st.ram; $('#gRamV').textContent = (S.st.ram / 1024).toFixed(1) + ' ГБ';
}
async function onLogin(acc) { S.st.account = acc; renderSide(); renderAccount(); toast(`Вы вошли как ${acc.name}`); }
$('#bOff').onclick = async () => { try { await onLogin(await api.invoke('login-offline', $('#nick').value)); S.st.nick = $('#nick').value.trim(); } catch (e) { toast(errMsg(e), 'err'); } };
$('#bOut').onclick = async () => { await api.invoke('logout'); S.st.account = null; renderSide(); renderAccount(); };
$('#gRam').oninput = e => { S.st.ram = +e.target.value; $('#gRamV').textContent = (S.st.ram / 1024).toFixed(1) + ' ГБ'; api.invoke('set-ram', S.st.ram); };

let devUri = 'https://www.microsoft.com/link';
$('#bDev').onclick = async () => {
  $('#bDev').disabled = $('#bWin').disabled = true;
  try {
    const { userCode, uri } = await api.invoke('ms-device-start');
    devUri = uri; $('#devLink').textContent = uri.replace(/^https:\/\//, '');
    $('#devCode').innerHTML = [...userCode].map((c, k) => `<span style="animation-delay:${k * 50}ms">${esc(c)}</span>`).join('');
    $('#devBox').hidden = false; $('#devBox').dataset.code = userCode;
    await onLogin(await api.invoke('ms-device-wait'));
  } catch (e) { toast(errMsg(e), 'err'); }
  $('#devBox').hidden = true; $('#bDev').disabled = $('#bWin').disabled = false;
};
$('#devCancel').onclick = () => api.invoke('ms-device-cancel');
$('#devLink').onclick = e => { e.preventDefault(); api.invoke('open-external', devUri); };
$('#devCopy').onclick = () => { navigator.clipboard.writeText($('#devBox').dataset.code || '').then(() => toast('Код скопирован')); };
$('#bWin').onclick = async () => {
  $('#bDev').disabled = $('#bWin').disabled = true;
  try { await onLogin(await api.invoke('ms-window')); } catch (e) { toast(errMsg(e), 'err'); }
  $('#bDev').disabled = $('#bWin').disabled = false;
};

// ---------- редактор скина: 3D-модель + развёртка ----------
const PARTS = {
  'Голова': [[0, 8, 8, 8], [8, 8, 8, 8], [16, 8, 8, 8], [24, 8, 8, 8], [8, 0, 8, 8], [16, 0, 8, 8]],
  'Тело': [[16, 20, 4, 12], [20, 20, 8, 12], [28, 20, 4, 12], [32, 20, 8, 12], [20, 16, 8, 4], [28, 16, 8, 4]],
  'Пр. рука': [[40, 20, 4, 12], [44, 20, 4, 12], [48, 20, 4, 12], [52, 20, 4, 12], [44, 16, 4, 4], [48, 16, 4, 4]],
  'Пр. нога': [[0, 20, 4, 12], [4, 20, 4, 12], [8, 20, 4, 12], [12, 20, 4, 12], [4, 16, 4, 4], [8, 16, 4, 4]],
  'Лев. рука': [[32, 52, 4, 12], [36, 52, 4, 12], [40, 52, 4, 12], [44, 52, 4, 12], [36, 48, 4, 4], [40, 48, 4, 4]],
  'Лев. нога': [[16, 52, 4, 12], [20, 52, 4, 12], [24, 52, 4, 12], [28, 52, 4, 12], [20, 48, 4, 4], [24, 48, 4, 4]],
};
const SWATCHES = ['#000000', '#ffffff', '#8a9bab', '#4a4f57', '#d9a679', '#a8744f', '#5b3a29', '#f5d9b5', '#e5442f', '#e67e22', '#ffb82e', '#34d399', '#2f8fd0', '#3b3f9a', '#a78bfa', '#ff7eb6'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SC = 7, U = 13;                       // SC — масштаб развёртки, U — размер пикселя скина на 3D-модели
const sk = document.createElement('canvas'); sk.width = sk.height = 64;
const skx = sk.getContext('2d', { willReadFrequently: true });
const cv = $('#skCv'), cx = cv.getContext('2d');
const stage = $('#stage'), scene = $('#scene');
let tool = 'pen', skColor = '#ff4d36', layer = 0, slim = false, painting = false, orbit = null, dirtyF = false, is3d = true, last2d = null;
const view = { rx: -14, ry: -32, zoom: 1, auto: false };
const faces = [];
let undoS = [], redoS = [], skinReady = false, saveT = null;

function defaultSkin() {
  skx.clearRect(0, 0, 64, 64);
  const fill = (rects, col) => { skx.fillStyle = col; rects.forEach(([x, y, w, h]) => skx.fillRect(x, y, w, h)); };
  PARTS['Голова'].forEach((r, k) => fill([r], k === 3 || k === 4 ? '#5b3a29' : '#d9a679'));
  fill(PARTS['Тело'], '#2f8fd0'); fill(PARTS['Пр. рука'], '#2f8fd0'); fill(PARTS['Лев. рука'], '#2f8fd0');
  fill(PARTS['Пр. нога'], '#3b3f9a'); fill(PARTS['Лев. нога'], '#3b3f9a');
  const [x, y] = PARTS['Голова'][1];
  fill([[x, y + 4, 8, 1]], '#ffffff'); fill([[x + 1, y + 4, 2, 1], [x + 5, y + 4, 2, 1]], '#2f6fd0'); fill([[x + 2, y + 6, 4, 1]], '#a8744f');
}

// отмена / возврат
const snap = () => skx.getImageData(0, 0, 64, 64);
function beginStroke() { undoS.push(snap()); if (undoS.length > 60) undoS.shift(); redoS = []; }
function doUndo() { if (!undoS.length) return; redoS.push(snap()); skx.putImageData(undoS.pop(), 0, 0); dirty(); }
function doRedo() { if (!redoS.length) return; undoS.push(snap()); skx.putImageData(redoS.pop(), 0, 0); dirty(); }

// отрисовка
function dirty() {
  if (dirtyF) return; dirtyF = true;
  requestAnimationFrame(() => {
    dirtyF = false; renderAll();
    if (skinReady) { clearTimeout(saveT); saveT = setTimeout(() => api.invoke('skin-state-set', { dataUrl: sk.toDataURL('image/png'), slim }).catch(() => {}), 600); }   // скин сохраняется сам
  });
}
function renderAll() {
  if (is3d) for (const f of faces) { f.ctx.clearRect(0, 0, f.fw, f.fh); f.ctx.drawImage(sk, f.fx, f.fy, f.fw, f.fh, 0, 0, f.fw, f.fh); }
  else draw2d();
}
function draw2d() {
  cx.imageSmoothingEnabled = false; cx.clearRect(0, 0, 448, 448);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { cx.fillStyle = (x + y) % 2 ? '#2a3541' : '#212b35'; cx.fillRect(x * 4 * SC, y * 4 * SC, 4 * SC, 4 * SC); }
  cx.drawImage(sk, 0, 0, 448, 448);
  if ($('#skGuide').checked) {
    cx.strokeStyle = '#ffb82e'; cx.lineWidth = 1; cx.font = '700 11px sans-serif'; cx.fillStyle = '#ffb82e';
    for (const [name, rects] of Object.entries(PARTS)) {
      rects.forEach(([x, y, w, h]) => cx.strokeRect(x * SC + .5, y * SC + .5, w * SC - 1, h * SC - 1));
      const [x, y, , h] = rects[1]; cx.fillText(name, x * SC + 2, y > 4 ? y * SC - 4 : (y + h) * SC + 12);
    }
  }
}

// рисование
function floodFill(x, y, hex) {
  const img = skx.getImageData(0, 0, 64, 64), d = img.data;
  const rgb = [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16)).concat(255);
  const at = (px, py) => (py * 64 + px) * 4, t0 = at(x, y), target = [d[t0], d[t0 + 1], d[t0 + 2], d[t0 + 3]];
  if (target.every((v, k) => v === rgb[k])) return;
  const stack = [[x, y]];
  while (stack.length) {
    const [px, py] = stack.pop(); if (px < 0 || py < 0 || px > 63 || py > 63) continue;
    const o = at(px, py); if (!target.every((v, k) => d[o + k] === v)) continue;
    rgb.forEach((v, k) => d[o + k] = v); stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
  }
  skx.putImageData(img, 0, 0);
}
function paintAt(x, y) {
  if (x < 0 || y < 0 || x > 63 || y > 63) return;
  if (tool === 'pen') { skx.fillStyle = skColor; skx.fillRect(x, y, 1, 1); }
  else if (tool === 'erase') skx.clearRect(x, y, 1, 1);
  else if (tool === 'fill') floodFill(x, y, skColor);
  else { const [r, g, b, a] = skx.getImageData(x, y, 1, 1).data; if (a) setColor('#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')); setTool('pen'); }
  dirty();
}
function setTool(t) { tool = t; $$('#tools button').forEach(b => b.classList.toggle('on', b.dataset.tool === t)); }
function setColor(c) { skColor = c; $('#skColor').value = c; }

// 3D-модель из шести граней на каждый «кубик»; клик по грани рисует прямо на скине
function buildModel() {
  const model = $('#model'); model.innerHTML = ''; faces.length = 0;
  const aw = slim ? 3 : 4;
  const defs = [
    [0, [8, 8, 8], [0, 0], [0, -12, 0]], [1, [8, 8, 8], [32, 0], [0, -12, 0]],
    [0, [8, 12, 4], [16, 16], [0, -2, 0]], [1, [8, 12, 4], [16, 32], [0, -2, 0]],
    [0, [aw, 12, 4], [40, 16], [-(4 + aw / 2), -2, 0]], [1, [aw, 12, 4], [40, 32], [-(4 + aw / 2), -2, 0]],
    [0, [aw, 12, 4], [32, 48], [4 + aw / 2, -2, 0]], [1, [aw, 12, 4], [48, 48], [4 + aw / 2, -2, 0]],
    [0, [4, 12, 4], [0, 16], [-2, 10, 0]], [1, [4, 12, 4], [0, 32], [-2, 10, 0]],
    [0, [4, 12, 4], [16, 48], [2, 10, 0]], [1, [4, 12, 4], [0, 48], [2, 10, 0]],
  ];
  for (const [l, [w, h, d], [u, v], [bx, by, bz]] of defs) {
    const g = l ? 0.5 : 0, W = (w + 2 * g) * U, H = (h + 2 * g) * U, D = (d + 2 * g) * U;
    const box = document.createElement('div'); box.className = 'box l' + l;
    box.style.transform = `translate3d(${bx * U}px,${by * U}px,${bz * U}px)`;
    const fd = [
      [[u + d, v + d, w, h], W, H, `translateZ(${D / 2}px)`],
      [[u + 2 * d + w, v + d, w, h], W, H, `rotateY(180deg) translateZ(${D / 2}px)`],
      [[u, v + d, d, h], D, H, `rotateY(-90deg) translateZ(${W / 2}px)`],
      [[u + d + w, v + d, d, h], D, H, `rotateY(90deg) translateZ(${W / 2}px)`],
      [[u + d, v, w, d], W, D, `rotateX(90deg) translateZ(${H / 2}px)`],
      [[u + d + w, v, w, d], W, D, `rotateX(-90deg) translateZ(${H / 2}px)`],
    ];
    for (const [[fx, fy, fw, fh], sw, sh, tr] of fd) {
      const c = document.createElement('canvas'); c.width = fw; c.height = fh;
      c.style.cssText = `width:${sw}px;height:${sh}px;left:${-sw / 2}px;top:${-sh / 2}px;transform:${tr}`;
      const rec = { ctx: c.getContext('2d'), fx, fy, fw, fh, sw, sh };
      const hit = e => paintAt(fx + clamp(Math.floor(e.offsetX / sw * fw), 0, fw - 1), fy + clamp(Math.floor(e.offsetY / sh * fh), 0, fh - 1));
      c.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.stopPropagation(); beginStroke(); painting = true; hit(e); });
      c.addEventListener('pointermove', e => { if (painting) hit(e); });
      faces.push(rec); box.appendChild(c);
    }
    model.appendChild(box);
  }
}
window.addEventListener('pointerup', () => { painting = false; last2d = null; });

// вращение и масштаб
function applyView() { scene.style.transform = `scale(${view.zoom}) rotateX(${view.rx}deg) rotateY(${view.ry}deg)`; }
stage.onpointerdown = e => {
  if (e.button === 0 && e.target.tagName === 'CANVAS') return;
  if (e.target.closest('.stage-ui')) return;
  orbit = { x: e.clientX, y: e.clientY }; view.auto = false; $('#skAuto').classList.remove('on');
  stage.setPointerCapture(e.pointerId); stage.classList.add('grabbing');
};
stage.onpointermove = e => {
  if (!orbit) return;
  view.ry += (e.clientX - orbit.x) * 0.6; view.rx = clamp(view.rx - (e.clientY - orbit.y) * 0.6, -90, 90);
  orbit = { x: e.clientX, y: e.clientY }; applyView();
};
stage.onpointerup = () => { orbit = null; stage.classList.remove('grabbing'); };
stage.oncontextmenu = e => e.preventDefault();
stage.onwheel = e => { e.preventDefault(); view.zoom = clamp(view.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.5, 2.6); applyView(); };
$$('.stage-ui button').forEach(b => b.onclick = () => {
  const v = b.dataset.v;
  if (v === 'auto') { view.auto = !view.auto; b.classList.toggle('on', view.auto); if (view.auto) spin(); return; }
  view.auto = false; $('#skAuto').classList.remove('on');
  Object.assign(view, { front: { rx: -8, ry: 0 }, back: { rx: -8, ry: 180 }, left: { rx: -8, ry: -90 }, right: { rx: -8, ry: 90 } }[v]); applyView();
});
function spin() { if (!view.auto) return; view.ry += 0.7; applyView(); requestAnimationFrame(spin); }

// развёртка
const pos2d = e => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * 64), Math.floor((e.clientY - r.top) / r.height * 64)]; };
cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); beginStroke(); last2d = pos2d(e); paintAt(...last2d); if (tool === 'fill' || tool === 'pick') last2d = null; };
cv.onpointermove = e => {
  if (!last2d) return; const [x, y] = pos2d(e), [x0, y0] = last2d, n = Math.max(Math.abs(x - x0), Math.abs(y - y0)) || 1;
  for (let k = 1; k <= n; k++) paintAt(Math.round(x0 + (x - x0) * k / n), Math.round(y0 + (y - y0) * k / n));
  last2d = [x, y];
};

// панели
$('#viewSeg').onclick = e => {
  const b = e.target.closest('button'); if (!b) return; is3d = b.dataset.t === '3d';
  $$('#viewSeg button').forEach(x => x.classList.toggle('on', x === b));
  stage.hidden = !is3d; $('#flat').hidden = is3d; $('#guideRow').hidden = is3d; dirty();
};
$('#layerSeg').onclick = e => {
  const b = e.target.closest('button'); if (!b) return; layer = +b.dataset.t;
  $$('#layerSeg button').forEach(x => x.classList.toggle('on', x === b));
  stage.classList.toggle('edit-over', layer === 1); stage.classList.toggle('edit-base', layer === 0);
};
$('#skOver').onchange = e => stage.classList.toggle('hide-over', !e.target.checked);
$('#skSlim').onchange = e => { slim = e.target.checked; buildModel(); dirty(); };
$('#skGuide').onchange = () => dirty();
$('#tools').onclick = e => { const b = e.target.closest('button'); if (b) setTool(b.dataset.tool); };
$('#skColor').oninput = e => skColor = e.target.value;
$('#swatches').innerHTML = SWATCHES.map(c => `<button style="background:${c}" data-c="${c}" aria-label="${c}"></button>`).join('');
$('#swatches').onclick = e => { const b = e.target.closest('button'); if (b) setColor(b.dataset.c); };
$('#skUndo').onclick = doUndo; $('#skRedo').onclick = doRedo;
$('#skClear').onclick = () => { beginStroke(); skx.clearRect(0, 0, 64, 64); dirty(); };
document.addEventListener('keydown', e => {
  if (S.view !== 'skin' || e.target.matches('input,select,textarea')) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); }
  else if (mod && k === 'y') { e.preventDefault(); doRedo(); }
  else if (!mod) { const t = { b: 'pen', e: 'erase', f: 'fill', i: 'pick' }[k]; if (t) setTool(t); }
});

// старые скины 64x32 → 64x64: левые рука и нога зеркалом от правых
function legacyFix() {
  const fr = (u, v) => ({ right: [u, v + 4, 4, 12], front: [u + 4, v + 4, 4, 12], left: [u + 8, v + 4, 4, 12], back: [u + 12, v + 4, 4, 12], top: [u + 4, v, 4, 4], bottom: [u + 8, v, 4, 4] });
  const swap = { right: 'left', front: 'front', left: 'right', back: 'back', top: 'top', bottom: 'bottom' };
  for (const [su, sv, du, dv] of [[0, 16, 16, 48], [40, 16, 32, 48]]) {
    const s = fr(su, sv), t = fr(du, dv);
    for (const k of Object.keys(t)) {
      const [sx, sy, w, h] = s[swap[k]], [dx, dy] = t[k];
      const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
      const tc = tmp.getContext('2d'); tc.translate(w, 0); tc.scale(-1, 1); tc.drawImage(sk, sx, sy, w, h, 0, 0, w, h);
      skx.drawImage(tmp, dx, dy);
    }
  }
}
function loadSkinUrl(url, silent) {
  return new Promise((ok, no) => {
    const img = new Image();
    img.onload = () => { if (!silent) beginStroke(); skx.clearRect(0, 0, 64, 64); if (img.height * 2 === img.width) { skx.drawImage(img, 0, 0, 64, 32); legacyFix(); } else skx.drawImage(img, 0, 0, 64, 64); dirty(); ok(); };
    img.onerror = () => no(new Error('Не удалось прочитать картинку'));
    img.src = url;
  });
}
function setSlim(v) { slim = v; $('#skSlim').checked = v; buildModel(); dirty(); }
$('#skOpen').onclick = async () => { const url = await api.invoke('skin-open'); if (url) try { await loadSkinUrl(url); } catch (e) { toast(errMsg(e), 'err'); } };
$('#skSave').onclick = async () => { if (await api.invoke('skin-save', sk.toDataURL('image/png'))) toast('Скин сохранён'); };
$('#skUp').onclick = async () => {
  if (!confirm('Это ИЗМЕНИТ скин вашего аккаунта Microsoft везде: в других лаунчерах (например Lunar Client) и на серверах.\n\nПрежний скин сохранится, и его можно вернуть кнопкой «Вернуть прежний скин аккаунта».\n\nПродолжить?')) return;
  try { const r = await api.invoke('skin-upload', { dataUrl: sk.toDataURL('image/png'), slim }); toast(r.backedUp ? 'Скин загружен в аккаунт. Прежний скин сохранён.' : 'Скин загружен в аккаунт (прежний сохранить не удалось).'); }
  catch (e) { toast(errMsg(e), 'err'); }
};
$('#skRestore').onclick = async () => {
  if (!confirm('Вернуть на аккаунт скин, который был до вашей последней загрузки из лаунчера?')) return;
  try { const r = await api.invoke('skin-restore'); await loadSkinUrl(r.dataUrl); setSlim(r.slim); toast('Прежний скин возвращён на аккаунт и открыт в редакторе'); }
  catch (e) { toast(errMsg(e), 'err'); }
};
$('#skFetch').onclick = async () => {
  try { const r = await api.invoke('skin-fetch', $('#skNick').value); await loadSkinUrl(r.dataUrl); setSlim(r.slim); toast(`Скин игрока ${r.name} загружен в редактор`); }
  catch (e) { toast(errMsg(e), 'err'); }
};
$('#skApply').onclick = async () => {
  if (!S.cur) { toast('Сначала выберите сборку', 'warn'); return; }
  try {
    const r = await api.invoke('skin-apply', { id: S.cur, dataUrl: sk.toDataURL('image/png') });
    toast(`Скин для ника ${r.nick} добавлен в сборку${r.installed ? ' (установлен CustomSkinLoader)' : ''}`); renderFiles();
  } catch (e) { toast(errMsg(e), 'err'); }
};
$('#skCsl').onclick = async () => {
  if (!S.cur) { toast('Сначала выберите сборку', 'warn'); return; }
  try { const added = await api.invoke('csl-install', S.cur); toast(added ? 'CustomSkinLoader установлен: скины лицензионных игроков подтянутся по нику' : 'CustomSkinLoader уже стоит в этой сборке'); renderFiles(); }
  catch (e) { toast(errMsg(e), 'err'); }
};

// ---------- обновления ----------
let updInfo = null;
async function checkUpdate(manual) {
  const r = await api.invoke('update-check');
  if (r.state === 'new') {
    updInfo = r; $('#updVer').textContent = r.version; $('#updBanner').hidden = false; $('#updBanner').title = r.notes || '';
    if (manual) $('#updState').textContent = `Доступна версия ${r.version}`;
  } else if (manual) {
    $('#updState').textContent = r.state === 'latest' ? 'У вас последняя версия' : (/404/.test(r.error) ? 'На GitHub пока нет опубликованных релизов' : 'Не удалось проверить: ' + r.error);
  }
}
$('#updLater').onclick = () => $('#updBanner').hidden = true;
$('#updNow').onclick = async () => {
  if (!updInfo || !updInfo.hasAsset) { api.invoke('open-release'); return; }
  $('#updNow').disabled = true; $('#updMsg').textContent = 'Скачиваю обновление… 0%';
  try {
    const r = await api.invoke('update-install');
    $('#updMsg').textContent = r.quit ? 'Устанавливаю обновление… лаунчер сам закроется и откроется заново' : 'Откройте скачанный файл и установите вручную';
  } catch (e) { toast(errMsg(e), 'err'); $('#updNow').disabled = false; $('#updMsg').textContent = 'Не удалось скачать обновление'; }
};
api.onUpdateProgress(f => $('#updMsg').textContent = `Скачиваю обновление… ${Math.round(f * 100)}%`);
$('#updCheck').onclick = () => { $('#updState').textContent = 'Проверяю…'; checkUpdate(true); };

// ---------- вход с сайта ----------
async function siteClaim(code) {
  try { await onLogin(await api.invoke('site-claim', code)); $('#siteBanner').hidden = true; }
  catch (e) { toast(errMsg(e), 'err'); }
}
$('#siteFind').onclick = async () => {
  const r = await api.invoke('site-peek');
  if (!r.found) { toast('На сайте нет аккаунта для вашего IP-адреса. Введите код с сайта.', 'warn'); return; }
  if (confirm(`На сайте найден аккаунт ${r.name}. Войти как ${r.name}?`)) siteClaim();
};
let siteWatch = null;
$('#siteOpen').onclick = () => {
  api.invoke('site-open'); clearInterval(siteWatch); let n = 0;
  siteWatch = setInterval(async () => {
    if (++n > 150) { clearInterval(siteWatch); return; }
    const r = await api.invoke('site-peek');
    if (r.found) { clearInterval(siteWatch); $('#siteName').textContent = r.name; $('#siteBanner').hidden = false; }
  }, 4000);
  toast('Войдите на сайте — лаунчер предложит войти под этим аккаунтом');
};
$('#siteGo').onclick = () => { const c = $('#siteCode').value.trim(); if (c.replace(/[^A-Za-z0-9]/g, '').length < 8) { toast('Введите код с сайта: 8 символов, например ABCD-2345', 'warn'); return; } siteClaim(c); };
$('#siteSave').onclick = async () => { try { S.st.site = await api.invoke('set-site', $('#siteUrl').value); $('#siteUrl').value = S.st.site; toast('Адрес сайта сохранён'); } catch (e) { toast(errMsg(e), 'err'); } };
$('#siteYes').onclick = () => siteClaim();
$('#siteNo').onclick = () => $('#siteBanner').hidden = true;
api.onSiteCode(async code => {                       // пришли по кнопке «Открыть в лаунчере» на сайте
  go('account');
  const r = await api.invoke('site-peek', code);
  if (!r.found) { toast('Код с сайта устарел. Войдите на сайте заново.', 'warn'); return; }
  if (confirm(`Войти в лаунчер как ${r.name}?`)) siteClaim(code);
});
async function startupSitePeek() {
  if (S.st.account) return;
  const r = await api.invoke('site-peek');
  if (r.found) { $('#siteName').textContent = r.name; $('#siteBanner').hidden = false; }
}

// ---------- сообщить о проблеме и уведомления ----------
$('#repSend').onclick = async () => {
  const b = $('#repSend'); b.disabled = true;
  try {
    const r = await api.invoke('report-send', { where: $('#repWhere').value, text: $('#repText').value });
    $('#repText').value = ''; toast('Спасибо! Мы получили сообщение. Когда проблема будет решена, вы увидите уведомление здесь или на сайте.');
  } catch (e) { toast(errMsg(e), 'err'); }
  b.disabled = false;
};
$('#forumOpen').onclick = () => api.invoke('open-forum-home');
const SOLVED_REVIEWS = [
  'Прикиньте! Я нашёл проблему и её сразу же починили! Вот это разработчики!',
  'Написал о баге в TnT Launcher, а его уже исправили. Вот это скорость!',
  'Нашёл проблему, сообщил — и всё уже работает. Разработчики молодцы!',
  'Сообщил о баге и почти сразу получил исправление. Спасибо, разработчики!',
];
const FEATURE_REVIEWS = [t => `Прикиньте, какая фича есть! ${t}`, t => `Думал, это баг, а оказалось — фича! ${t}`, t => `Вот это фича! ${t}`];
const pickRnd = arr => arr[Math.floor(Math.random() * arr.length)];
const nDlg = $('#dNotif'), shownN = new Set();
let curN = null, curReview = null;
function showNotif(n) {
  curN = n; shownN.add(n.id);
  const solved = n.status === 'solved';
  $('#notTitle').textContent = solved ? 'Ваша проблема решена!' : 'Это оказалась фича';
  $('#notBody').textContent = solved ? 'Спасибо за вашу преданность!' : 'Спасибо за вашу преданность, но это была фича.';
  $('#notQuote').textContent = n.text;
  curReview = { title: solved ? 'Проблему починили!' : 'Какая фича есть!', body: solved ? pickRnd(SOLVED_REVIEWS) : pickRnd(FEATURE_REVIEWS)(n.text) };
  nDlg.showModal();
}
const ackNotif = () => { if (curN) api.invoke('notif-ack', curN.id); curN = null; };
$('#notClose').onclick = () => { nDlg.close(); ackNotif(); };
$('#notForum').onclick = async () => { await api.invoke('open-forum', curReview); toast('Текст отзыва скопирован: если поле на форуме пустое, просто вставьте его'); nDlg.close(); ackNotif(); };
async function checkNotifs() {
  if (nDlg.open) return;
  const list = await api.invoke('notif-fetch');
  const n = list.find(x => !shownN.has(x.id));
  if (n) showNotif(n);
}

// ---------- быстрые кнопки папок ----------
$('#quick').onclick = async e => {
  const b = e.target.closest('button'); if (!b || !S.cur) return;
  const err = await api.invoke('inst-open', { id: S.cur, folder: b.dataset.open || undefined });
  if (err) toast('Не удалось открыть папку: ' + err, 'err');
};

// ---------- цвет сборки ----------
const PALETTE = ['#ff4d36', '#ffb82e', '#34d399', '#4da3ff', '#a78bfa', '#fb923c', '#f472b6', '#94a3b8'];
$('#sColors').innerHTML = PALETTE.map(c => `<button data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('') +
  '<label class="cpick" title="Свой цвет"><input type="color" id="sColorCustom" value="#ff4d36"></label>';
async function setInstColor(c) {
  const i = cur(); if (!i) return;
  try { await api.invoke('inst-update', { id: i.id, patch: { color: c } }); await refresh(); renderSide(); renderInst(); }
  catch (e) { toast(errMsg(e), 'err'); }
}
$('#sColors').onclick = e => { const b = e.target.closest('button[data-c]'); if (b) setInstColor(b.dataset.c); };
$('#sColorCustom').onchange = e => setInstColor(e.target.value);
function markColor(i) {
  $$('#sColors button').forEach(b => b.classList.toggle('on', b.dataset.c.toLowerCase() === String(i.color).toLowerCase()));
  $('#sColorCustom').value = i.color;
}

// ---------- скин по нику лицензии (без модов) ----------
function showSkinNick() { $('#skinNick').value = S.st.skinNick || ''; $('#skinNickState').textContent = S.st.skinNick ? `Сейчас используется скин игрока ${S.st.skinNick} (офлайн-режим).` : 'Не задан: в офлайн-режиме будет стандартный скин.'; }
$('#skinNickSave').onclick = async () => {
  try { const r = await api.invoke('set-skin-nick', $('#skinNick').value); S.st.skinNick = r.name || ''; showSkinNick(); toast(r.name ? `Скин игрока ${r.name} будет в игре` : 'Скин сброшен'); }
  catch (e) { toast(errMsg(e), 'err'); }
};
$('#skinNickClear').onclick = async () => { await api.invoke('set-skin-nick', ''); S.st.skinNick = ''; showSkinNick(); toast('Скин сброшен'); };

// ---------- Bedrock ----------
const BE_NAMES = { resource_packs: 'ресурспаков', behavior_packs: 'аддонов', skin_packs: 'скин-паков', minecraftWorlds: 'миров' };
let beKind = 'resource_packs', beInfo = null;
function beTab(t) {
  $$('#beTabs button').forEach(b => b.classList.toggle('on', b.dataset.bt === t));
  $$('#v-bedrock .bpane').forEach(p => p.classList.toggle('on', p.id === 'bp-' + t));
}
$('#beTabs').onclick = e => { const b = e.target.closest('button'); if (b) beTab(b.dataset.bt); };
async function renderBedrock() {
  $('#beAv').outerHTML = av('B', '#4da3ff', 'xl').replace('class="av xl"', 'class="av xl" id="beAv"');
  $('#beHero').style.setProperty('--c', '#4da3ff');
  $('#beChips').innerHTML = '<span class="chip">проверяю…</span>';
  beInfo = await api.invoke('be-info');
  const note = (t, s) => { $('#beNote').hidden = !t; $('#beNoteT').textContent = t || ''; $('#beNoteS').textContent = s || ''; };
  if (!beInfo.supported) {
    $('#beChips').innerHTML = '<span class="chip">только Windows</span>';
    note(t('bedrock.unsupported'), '');
    $('#beMain').hidden = true; $('#bePlay').disabled = true; $('#beQuick').hidden = true; $('#beText').textContent = ''; return;
  }
  $('#beMain').hidden = false; $('#bePlay').disabled = false; $('#beQuick').hidden = false;
  $('#beChips').innerHTML = `<span class="chip">${beInfo.installed ? 'Установлена' + (beInfo.version ? ' · ' + esc(beInfo.version) : '') : 'Не установлена'}</span><span class="chip">${beInfo.dir ? 'папка данных найдена' : 'папки данных нет'}</span>`;
  if (!beInfo.installed) note('Игра Bedrock не найдена', 'Купите и установите Minecraft for Windows из Microsoft Store. Кнопка «Играть» откроет страницу магазина.');
  else if (!beInfo.dir) note('Папка данных ещё не создана', 'Запустите игру один раз через кнопку «Играть», затем вернитесь сюда: управление паками и мирами заработает.');
  else note();
  $('#beText').textContent = beInfo.dir || '';
  renderBeList();
}
async function renderBeList() {
  const box = $('#beList');
  if (!beInfo || !beInfo.dir) { box.innerHTML = '<div class="empty">Папка данных Bedrock пока не найдена</div>'; return; }
  let items = []; try { items = await api.invoke('be-list', beKind); } catch (e) { toast(errMsg(e), 'err'); }
  box.innerHTML = items.length ? items.map(x => `<div class="item" data-f="${esc(x.folder)}"><span class="nm">${esc(x.name)}</span><small>${esc(x.folder)}</small><button class="btn sm danger" data-a="d">Удалить</button></div>`).join('')
    : `<div class="empty">Нет ${BE_NAMES[beKind]}</div>`;
}
$('#beKindSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; beKind = b.dataset.k; seg($('#beKindSeg'), beKind); renderBeList(); };
$('#beList').onclick = async e => {
  const b = e.target.closest('[data-a=d]'); if (!b) return;
  const f = b.closest('.item').dataset.f;
  if (!confirm(`Удалить «${f}»? Это нельзя отменить.`)) return;
  try { await api.invoke('be-delete', { kind: beKind, folder: f }); renderBeList(); } catch (er) { toast(errMsg(er), 'err'); }
};
$('#beQuick').onclick = async e => {
  const b = e.target.closest('button'); if (!b) return;
  try { const err = await api.invoke('be-open', b.dataset.be || undefined); if (err) toast('Не удалось открыть папку: ' + err, 'err'); } catch (er) { toast(errMsg(er), 'err'); }
};
$('#bePlay').onclick = async () => {
  try { const r = await api.invoke('be-play'); toast(r.opened === 'game' ? 'Запускаю Minecraft Bedrock…' : 'Открыл страницу Minecraft в Microsoft Store', r.opened === 'game' ? '' : 'warn'); }
  catch (e) { toast(errMsg(e), 'err'); }
};
$('#beInstall').onclick = async () => {
  try { const r = await api.invoke('be-install-file'); if (r.length) { toast('Установлено: ' + r.join(', ')); renderBeList(); } }
  catch (e) { toast(errMsg(e), 'err'); }
};
async function searchBe() {
  skeleton($('#beGrid'));
  try {
    const hits = await api.invoke('be-search', $('#beQ').value);
    $('#beGrid').innerHTML = hits.length ? hits.map(h => card(h, 'Установить')).join('') : '<div class="empty">Ничего не найдено</div>';
    $$('#beGrid .card-item').forEach((c, k) => { c.dataset.url = hits[k].url || ''; });
  } catch (e) { $('#beGrid').innerHTML = ''; toast(errMsg(e), 'err'); if (/ключ/i.test(errMsg(e))) beTab('set'); }
}
$('#beGo').onclick = searchBe;
$('#beQ').onkeydown = e => { if (e.key === 'Enter') searchBe(); };
$('#beGrid').onclick = async e => {
  const b = e.target.closest('[data-a=install]'); if (!b) return;
  const c = b.closest('.card-item');
  b.textContent = '…'; b.disabled = true;
  try {
    const r = await api.invoke('be-install-mod', { id: c.dataset.id, url: c.dataset.url });
    if (r.manual) { b.textContent = 'Скачайте вручную'; toast('Автор запретил автоскачивание: открыл его страницу. Скачайте файл и нажмите «Установить файл».', 'warn'); }
    else { b.textContent = 'Установлено'; toast('Установлено: ' + r.results.join(', ')); renderBeList(); }
  } catch (er) { b.textContent = 'Установить'; b.disabled = false; toast(errMsg(er), 'err'); }
};
$('#beKeySave').onclick = async () => { const ok = await api.invoke('set-curse-key', $('#beKey').value); toast(ok ? 'Ключ сохранён' : 'Ключ удалён'); };
$('#beKeyGet').onclick = () => api.invoke('open-external', 'https://console.curseforge.com/');

// ---------- удаление лаунчера ----------
const un = $('#dUn'), unBody = $('#unBody');
let unWorlds = [], unKeep = [], unDest = null;
const unErr = t => { const el = $('#unErr'); if (el) el.textContent = t || ''; };
function unStep1() {
  unBody.innerHTML = `<h3>Удалить TnT Launcher?</h3>
    <p><b>Будет удалено:</b> приложение, все сборки с модами, настройки, ваш скин и загруженная Java.</p>
    <p><b>Не затрагивается:</b> другие лаунчеры, обычная папка .minecraft и ваш Minecraft Bedrock с его мирами.</p>
    <div class="row end"><button class="btn ghost" id="unNo">Отмена</button><button class="btn danger" id="unGo">Продолжить</button></div>`;
  $('#unNo').onclick = () => un.close();
  $('#unGo').onclick = async () => {
    try { unWorlds = await api.invoke('uninstall-scan'); } catch (e) { unWorlds = []; }
    unWorlds.length ? unStepWorlds() : unStepFinal([]);
  };
}
function unStepWorlds() {
  unBody.innerHTML = `<h3>Хотите удалить все ваши миры?</h3>
    <p>В сборках найдено миров: <b>${unWorlds.length}</b>. Что с ними сделать?</p>
    <div class="un-actions">
      <button class="btn" id="unKeepAll">Нет, оставьте<small>Сохраню все миры в папку, которую вы выберете</small></button>
      <button class="btn" id="unKeepSome">Нет, но только некоторые<small>Выберу, какие миры оставить</small></button>
      <button class="btn danger" id="unDelAll">Да, удалить<small>Миры будут удалены вместе с лаунчером</small></button>
    </div><div class="row end"><button class="btn ghost" id="unNo">Отмена</button></div>`;
  $('#unNo').onclick = () => un.close();
  $('#unKeepAll').onclick = () => unPickDest(unWorlds);
  $('#unKeepSome').onclick = unStepSome;
  $('#unDelAll').onclick = () => unStepFinal([]);
}
function unStepSome() {
  unBody.innerHTML = `<h3>Какие миры оставить?</h3><p>Отметьте миры, которые нужно сохранить. Остальные будут удалены.</p>
    <div class="un-list">${unWorlds.map((w, k) => `<label><input type="checkbox" data-k="${k}" checked><span>${esc(w.world)}</span><small>${esc(w.inst)}</small></label>`).join('')}</div>
    <div class="row end"><button class="btn ghost" id="unBack">Назад</button><button class="btn primary" id="unNext">Выбрать папку</button></div><div class="un-err" id="unErr"></div>`;
  $('#unBack').onclick = unStepWorlds;
  $('#unNext').onclick = () => {
    const keep = $$('.un-list input:checked', unBody).map(i => unWorlds[+i.dataset.k]);
    keep.length ? unPickDest(keep) : unStepFinal([]);
  };
}
async function unPickDest(keep) {
  const d = await api.invoke('pick-dir');
  if (!d) return;
  unStepFinal(keep, d);
}
function unStepFinal(keep, dest) {
  unKeep = keep; unDest = dest || null;
  const text = keep.length ? `Сохраню миров: <b>${keep.length}</b> → папка <b>${esc(dest)}</b> (внутри будет «TnT Launcher — сохранённые миры»). Остальные миры удалятся.`
    : unWorlds.length ? '<b>Все миры будут удалены без возможности восстановления.</b>' : 'Миров в сборках нет.';
  unBody.innerHTML = `<h3>Последнее подтверждение</h3><p>${text}</p><p>Затем лаунчер закроется и удалится.</p>
    <div class="row end"><button class="btn ghost" id="unBack">Отмена</button><button class="btn danger" id="unRun">Удалить лаунчер</button></div><div class="un-err" id="unErr"></div>`;
  $('#unBack').onclick = () => un.close();
  $('#unRun').onclick = async () => {
    $('#unRun').disabled = true; $('#unRun').textContent = 'Удаляю…';
    try {
      const r = await api.invoke('uninstall-run', { keep: unKeep, dest: unDest });
      unBody.innerHTML = `<h3>Готово</h3><p>Лаунчер удаляется и сейчас закроется.${r.savedTo ? '<br>Миры сохранены: <b>' + esc(r.savedTo) + '</b>' : ''}</p>`;
    } catch (e) { $('#unRun').disabled = false; $('#unRun').textContent = 'Удалить лаунчер'; unErr(errMsg(e)); }
  };
}
$('#unStart').onclick = () => { unStep1(); un.showModal(); };

// ---------- старт ----------
(async () => {
  hydrate();
  initLangSwitcher();
  applyI18n();
  defaultSkin(); buildModel(); applyView(); dirty();
  try {
    const st = await api.invoke('skin-state-get');
    if (st.dataUrl) { await loadSkinUrl(st.dataUrl, true); if (st.slim) setSlim(true); }
    else if (S.st.account && S.st.account.type === 'microsoft') {            // первый запуск: берём настоящий скин аккаунта, а не пробный
      const r = await api.invoke('skin-fetch', S.st.account.name); await loadSkinUrl(r.dataUrl, true); setSlim(r.slim);
    }
  } catch {}
  skinReady = true; dirty();
  S.st = await api.invoke('state');
  await refresh();
  renderSide(); go(S.edition === 'bedrock' ? 'bedrock' : 'inst');
  try {
    S.versions = await api.invoke('versions');
    if (!S.insts.length) {
      const v = S.versions.find(x => x.type === 'release');
      const i = await api.invoke('inst-create', { name: 'Minecraft ' + v.id, version: v.id, loader: 'vanilla' });
      await refresh(); select(i.id);
    } else renderInst();
  } catch (e) { toast('Не удалось загрузить список версий: ' + errMsg(e), 'err'); }
  setTimeout(() => checkUpdate(false), 2500);
  setTimeout(startupSitePeek, 1200);
  setTimeout(checkNotifs, 4000); setInterval(checkNotifs, 120000);
})();
