const { app, BrowserWindow, ipcMain, shell, dialog, session, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execFileSync, spawn } = require('child_process');
const { Client, Authenticator } = require('minecraft-launcher-core');
const extract = require('extract-zip');

const UA = { 'User-Agent': 'TnTLauncher/1.0' };
const enc = encodeURIComponent;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const root = path.join(app.getPath('appData'), '.tntlauncher');
const sharedDir = path.join(root, 'shared');
const runtimeDir = path.join(root, 'runtime');
[sharedDir, runtimeDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ---------- хранилище ----------
const cfgFile = path.join(root, 'config.json');
let cfg = { account: null, ram: 4096, nick: 'Player' };
try { cfg = { ...cfg, ...JSON.parse(fs.readFileSync(cfgFile, 'utf8')) }; } catch {}
const saveCfg = () => fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2));
const instFile = path.join(root, 'instances.json');
let insts = [];
try { insts = JSON.parse(fs.readFileSync(instFile, 'utf8')); } catch {}
const saveInsts = () => fs.writeFileSync(instFile, JSON.stringify(insts, null, 2));
const instRoot = path.join(root, 'instances');
const instDir = i => path.join(instRoot, i.dir || i.id);          // папка сборки носит её название
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
function dirNameFor(name, exceptId) {
  let base = String(name || '').replace(/[<>:"\/\\|?*\x00-\x1f]/g, '').replace(/^\.+/, '').replace(/[. ]+$/, '').trim().slice(0, 40).trim() || 'Сборка';
  if (RESERVED.test(base)) base += '_';
  const mine = exceptId && insts.find(x => x.id === exceptId);
  const taken = new Set(insts.filter(x => x.id !== exceptId).map(x => (x.dir || x.id).toLowerCase()));
  const free = d => !taken.has(d.toLowerCase()) && (!fs.existsSync(path.join(instRoot, d)) || (mine && (mine.dir || mine.id).toLowerCase() === d.toLowerCase()));
  let d = base, n = 2;
  while (!free(d)) d = `${base} (${n++})`;
  return d;
}
function migrateDirs() {                                           // старые сборки с папками-кодами переименовываем по названию
  let changed = false;
  for (const i of insts) {
    if (i.dir) continue;
    const old = path.join(instRoot, i.id), d = dirNameFor(i.name, i.id);
    try { if (fs.existsSync(old)) fs.renameSync(old, path.join(instRoot, d)); i.dir = d; }
    catch { i.dir = i.id; }
    changed = true;
  }
  if (changed) saveInsts();
}
fs.mkdirSync(instRoot, { recursive: true });
migrateDirs();
const sub = (i, n) => { const d = path.join(instDir(i), n); fs.mkdirSync(d, { recursive: true }); return d; };
let child = null, runningId = null;
const GAME_DIRS = ['mods', 'resourcepacks', 'shaderpacks', 'saves', 'config', 'screenshots', 'logs'];
function ensureGameDirs(i) { GAME_DIRS.forEach(n => fs.mkdirSync(path.join(instDir(i), n), { recursive: true })); }
const byId = id => { const i = insts.find(x => x.id === id); if (!i) throw new Error('Сборка не найдена'); return i; };
const COLORS = ['#ff4d36', '#ffb82e', '#34d399', '#4da3ff', '#a78bfa', '#fb923c'];
function createInst(d) {
  const bedrock = d.kind === 'bedrock';
  const i = {
    id: crypto.randomBytes(4).toString('hex'),
    name: (d.name || (bedrock ? 'Новая сборка Bedrock' : `Minecraft ${d.version}`)).trim().slice(0, 40),
    version: d.version, loader: d.loader || 'vanilla', loaderVersion: d.loaderVersion || null,
    ram: d.ram || null, jvm: d.jvm || '', color: COLORS[insts.length % COLORS.length], lastPlayed: 0,
  };
  if (bedrock) { i.kind = 'bedrock'; delete i.version; delete i.loader; delete i.loaderVersion; delete i.ram; delete i.jvm; }
  i.dir = dirNameFor(i.name, i.id);
  bedrock ? beProfileDir(i) : ensureGameDirs(i);
  insts.push(i); saveInsts();
  return i;
}

// ---------- утилиты ----------
let win;
const send = (ch, m) => win && !win.isDestroyed() && win.webContents.send(ch, m);
const log = m => send('log', String(m));
const prog = (text, frac) => send('progress', { text, frac });
const getJson = async url => {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};
const download = async (url, dest) => {
  const r = await fetch(url, { headers: UA, redirect: 'follow' });
  if (!r.ok) throw new Error(`Не удалось скачать (${r.status}): ${url}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
};
let manifest;
const getManifest = async () => manifest ||= await getJson('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');

function createWindow() {
  const isMac = process.platform === 'darwin';
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 1060, minHeight: 680, backgroundColor: '#0a0e13', title: 'TnT Launcher',
    icon: path.join(__dirname, 'build', 'icon.png'), autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    ...(isMac ? { trafficLightPosition: { x: 18, y: 18 } } : { titleBarOverlay: { color: '#0a0e13', symbolColor: '#e9eef2', height: 44 } }),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}
if (!app.requestSingleInstanceLock()) app.quit();
if (process.defaultApp) { if (process.argv.length >= 2) app.setAsDefaultProtocolClient('tntlauncher', process.execPath, [path.resolve(process.argv[1])]); }
else app.setAsDefaultProtocolClient('tntlauncher');
let pendingLink = process.argv.find(a => a.startsWith('tntlauncher://'));
function deepLink(url) {
  try { const u = new URL(url); const code = u.hostname === 'login' && u.searchParams.get('code'); if (code) send('site-code', code); } catch {}
}
app.on('second-instance', (_, argv) => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  const l = argv.find(a => a.startsWith('tntlauncher://')); if (l) deepLink(l);
});
app.on('open-url', (e, url) => { e.preventDefault(); deepLink(url); });
app.whenReady().then(() => { createWindow(); win.webContents.once('did-finish-load', () => { if (pendingLink) setTimeout(() => deepLink(pendingLink), 800); }); });
app.on('window-all-closed', () => app.quit());

// ---------- общее ----------
ipcMain.handle('state', () => ({
  ram: cfg.ram, nick: cfg.nick, account: cfg.account && { type: cfg.account.type, name: cfg.account.name },
  totalMemMB: Math.floor(os.totalmem() / 1048576), platform: process.platform, version: app.getVersion(),
}));
ipcMain.handle('set-ram', (_, ram) => { cfg.ram = ram; saveCfg(); });
ipcMain.handle('versions', async () => (await getManifest()).versions.map(v => ({ id: v.id, type: v.type })));
ipcMain.handle('open-external', (_, url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); });

// ---------- сборки ----------
ipcMain.handle('inst-list', () => insts);
ipcMain.handle('inst-create', (_, d) => createInst(d));
ipcMain.handle('inst-update', (_, { id, patch }) => {
  const i = byId(id);
  const oldName = i.name;
  if ('color' in patch && !/^#[0-9a-f]{6}$/i.test(String(patch.color))) throw new Error('Неверный цвет');
  if (i.kind === 'bedrock') {                       // у Bedrock-сборок нет версии/загрузчика/памяти JVM
    for (const k of ['name', 'color']) if (k in patch) i[k] = patch[k];
  } else {
    for (const k of ['name', 'version', 'loader', 'ram', 'jvm', 'color']) if (k in patch) i[k] = patch[k];
    if ('version' in patch || 'loader' in patch) i.loaderVersion = null;
  }
  i.name = (i.name || 'Сборка').trim().slice(0, 40);
  if (i.name !== oldName) {
    if (child && runningId === i.id) { i.name = oldName; throw new Error('Остановите игру, чтобы переименовать сборку'); }
    const nd = dirNameFor(i.name, i.id);
    if (nd !== (i.dir || i.id)) {
      try { fs.renameSync(instDir(i), path.join(instRoot, nd)); i.dir = nd; }
      catch { i.name = oldName; throw new Error('Не удалось переименовать папку сборки. Закройте её в проводнике и попробуйте снова.'); }
    }
  }
  saveInsts(); return i;
});
ipcMain.handle('inst-delete', (_, id) => {
  const i = byId(id);
  if (child && runningId === id) throw new Error('Остановите игру, чтобы удалить сборку');
  fs.rmSync(instDir(i), { recursive: true, force: true });
  insts = insts.filter(x => x.id !== id); saveInsts();
});
ipcMain.handle('inst-open', (_, { id, folder }) => {
  const i = byId(id); ensureGameDirs(i);
  return shell.openPath(folder ? sub(i, folder) : instDir(i));   // '' = успех, иначе текст ошибки
});

const FOLDERS = ['mods', 'resourcepacks', 'shaderpacks', 'saves'];
const guardFolder = f => { if (!FOLDERS.includes(f)) throw new Error('Неверная папка'); return f; };
const safeIn = (d, n) => { const p = path.resolve(d, n); if (!p.startsWith(path.resolve(d) + path.sep)) throw new Error('Неверное имя'); return p; };
ipcMain.handle('files-list', (_, { id, folder }) => {
  const d = sub(byId(id), guardFolder(folder));
  return fs.readdirSync(d, { withFileTypes: true })
    .filter(e => folder === 'saves' ? e.isDirectory() : e.isFile())
    .map(e => ({ name: e.name, enabled: !e.name.endsWith('.disabled'), size: e.isFile() ? fs.statSync(path.join(d, e.name)).size : 0 }));
});
ipcMain.handle('file-delete', (_, { id, folder, name }) => fs.rmSync(safeIn(sub(byId(id), guardFolder(folder)), name), { recursive: true, force: true }));
ipcMain.handle('file-toggle', (_, { id, folder, name }) => {
  const d = sub(byId(id), guardFolder(folder)), p = safeIn(d, name);
  fs.renameSync(p, name.endsWith('.disabled') ? p.slice(0, -9) : p + '.disabled');
});
ipcMain.handle('file-add', async (_, { id, folder }) => {
  const d = sub(byId(id), guardFolder(folder));
  const r = await dialog.showOpenDialog(win, { properties: ['openFile', 'multiSelections'] });
  if (r.canceled) return 0;
  r.filePaths.forEach(p => fs.copyFileSync(p, path.join(d, path.basename(p))));
  return r.filePaths.length;
});

// ---------- вход Microsoft ----------
// Официальный клиент лаунчера Minecraft: свой Azure-ключ не нужен.
const MS_CLIENT = '00000000402b5328';
const MS_REDIRECT = 'https://login.live.com/oauth20_desktop.srf';
const SC_NEW = 'XboxLive.signin offline_access';
const SC_OLD = 'service::user.auth.xboxlive.com::MBI_SSL';
const XERR = {
  2148916233: 'У этого аккаунта Microsoft нет профиля Xbox. Создайте его на xbox.com и попробуйте снова.',
  2148916235: 'Xbox Live недоступен в вашей стране.',
  2148916238: 'Это детский аккаунт: добавьте его в семью Microsoft и разрешите онлайн-игру.',
};
async function pform(url, data) {
  const r = await fetch(url, { method: 'POST', headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
  let j = {}; try { j = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, j };
}
async function pjson(url, body, headers = {}) {
  const r = await fetch(url, { method: 'POST', headers: { ...UA, 'Content-Type': 'application/json', Accept: 'application/json', ...headers }, body: JSON.stringify(body) });
  let j = {}; try { j = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, j };
}
async function msToken(data) {
  const r = await pform('https://login.live.com/oauth20_token.srf', { client_id: MS_CLIENT, ...data });
  if (!r.j.access_token) throw new Error('Вход не удался: ' + (r.j.error_description || r.j.error || `код ${r.status}`));
  return r.j;
}
async function xboxChain(msAccess) {
  let xbl, last;
  for (const prefix of ['d=', '', 't=']) {          // разным способам входа нужен разный префикс билета
    const r = await pjson('https://user.auth.xboxlive.com/user/authenticate', {
      Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: prefix + msAccess },
      RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT',
    });
    if (r.ok) { xbl = r.j; break; }
    last = r;
  }
  if (!xbl) throw new Error(`Xbox Live отклонил вход (код ${last && last.status}). Попробуйте другой способ входа.`);
  const x = await pjson('https://xsts.auth.xboxlive.com/xsts/authorize', {
    Properties: { SandboxId: 'RETAIL', UserTokens: [xbl.Token] }, RelyingParty: 'rp://api.minecraftservices.com/', TokenType: 'JWT',
  });
  if (!x.ok) throw new Error(XERR[x.j.XErr] || `XSTS: ошибка ${x.status}`);
  const uhs = x.j.DisplayClaims.xui[0].uhs;
  const m = await pjson('https://api.minecraftservices.com/authentication/login_with_xbox', { identityToken: `XBL3.0 x=${uhs};${x.j.Token}` });
  if (!m.ok) throw new Error(`Minecraft отклонил вход (код ${m.status}). Попробуйте другой способ входа.`);
  const pr = await fetch('https://api.minecraftservices.com/minecraft/profile', { headers: { ...UA, Authorization: `Bearer ${m.j.access_token}` } });
  if (pr.status === 404) throw new Error('На этом аккаунте нет Minecraft: Java Edition. Купите игру или войдите другим аккаунтом.');
  if (!pr.ok) throw new Error(`Профиль Minecraft: ошибка ${pr.status}`);
  const p = await pr.json();
  return { name: p.name, id: p.id, mcToken: m.j.access_token };
}
async function finishLogin(tokens, scope) {
  const res = await xboxChain(tokens.access_token);
  cfg.account = { type: 'microsoft', name: res.name, uuid: res.id, refresh_token: tokens.refresh_token, scope };
  saveCfg();
  return { type: 'microsoft', name: res.name };
}
async function msRefresh() {
  const a = cfg.account;
  const t = await msToken({ grant_type: 'refresh_token', refresh_token: a.refresh_token, scope: a.scope || SC_OLD, redirect_uri: MS_REDIRECT });
  // Microsoft меняет refresh-токен при каждом обновлении и отзывает старый:
  // сохраняем новый СРАЗУ, до xboxChain, иначе сбой сети безвозвратно разлогинивает аккаунт.
  if (t.refresh_token) { a.refresh_token = t.refresh_token; saveCfg(); }
  const res = await xboxChain(t.access_token);
  a.name = res.name; saveCfg();
  return res;
}

// способ 1: код на microsoft.com/link (без копирования адресов)
let dev = null;
ipcMain.handle('ms-device-start', async () => {
  let lastErr = '';
  for (const scope of [SC_NEW, SC_OLD]) {
    const r = await pform('https://login.live.com/oauth20_connect.srf', { client_id: MS_CLIENT, scope, response_type: 'device_code' });
    if (r.j.user_code) {
      dev = { code: r.j.device_code, interval: (r.j.interval || 5) * 1000, until: Date.now() + (r.j.expires_in || 900) * 1000, scope, cancelled: false };
      const uri = r.j.verification_uri || 'https://www.microsoft.com/link';
      shell.openExternal(`${uri}${uri.includes('?') ? '&' : '?'}otc=${enc(r.j.user_code)}`);
      return { userCode: r.j.user_code, uri };
    }
    lastErr = r.j.error_description || r.j.error || `код ${r.status}`;
  }
  throw new Error('Microsoft не выдал код входа: ' + lastErr);
});
ipcMain.handle('ms-device-wait', async () => {
  const d = dev;
  if (!d) throw new Error('Сначала запросите код');
  while (Date.now() < d.until) {
    await sleep(d.interval);
    if (d.cancelled) throw new Error('Вход отменён');
    const r = await pform('https://login.live.com/oauth20_token.srf', {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code', client_id: MS_CLIENT, device_code: d.code });
    if (r.j.access_token) { dev = null; return finishLogin(r.j, d.scope); }
    const e = r.j.error;
    if (e === 'authorization_pending') continue;
    if (e === 'slow_down') { d.interval += 5000; continue; }
    throw new Error(r.j.error_description || e || `Ошибка входа (код ${r.status})`);
  }
  throw new Error('Время действия кода истекло. Начните заново.');
});
ipcMain.handle('ms-device-cancel', () => { if (dev) dev.cancelled = true; });

// способ 2: окно входа внутри лаунчера, адрес с кодом перехватывается автоматически
ipcMain.handle('ms-window', async () => {
  const code = await new Promise((resolve, reject) => {
    const sess = session.fromPartition('ms-' + Date.now());
    const w = new BrowserWindow({ width: 520, height: 720, parent: win, modal: true, title: 'Вход в Microsoft', autoHideMenuBar: true, webPreferences: { session: sess } });
    sess.webRequest.onBeforeRequest({ urls: [MS_REDIRECT + '*'] }, (d, cb) => {
      cb({ cancel: true });
      const u = new URL(d.url);
      const c = u.searchParams.get('code');
      if (c) resolve(c);
      else reject(new Error(u.searchParams.get('error_description') || u.searchParams.get('error') || 'Microsoft не вернул код входа'));
      setImmediate(() => { try { w.destroy(); } catch {} });
    });
    w.on('closed', () => reject(new Error('Окно входа закрыто')));
    w.loadURL('https://login.live.com/oauth20_authorize.srf?' + new URLSearchParams({
      client_id: MS_CLIENT, response_type: 'code', scope: SC_OLD, redirect_uri: MS_REDIRECT, prompt: 'select_account' }));
  });
  const t = await msToken({ grant_type: 'authorization_code', code, scope: SC_OLD, redirect_uri: MS_REDIRECT });
  return finishLogin(t, SC_OLD);
});

ipcMain.handle('login-offline', (_, nick) => {
  nick = (nick || '').trim();
  if (!/^\w{3,16}$/.test(nick)) throw new Error('Ник: 3–16 символов, буквы, цифры и _');
  cfg.nick = nick; cfg.account = { type: 'offline', name: nick }; saveCfg();
  return { type: 'offline', name: nick };
});
ipcMain.handle('logout', () => { cfg.account = null; saveCfg(); });

// ---------- Java ----------
function findJavaBin(dir, depth = 0) {
  const exe = process.platform === 'win32' ? 'javaw.exe' : 'java';
  const direct = path.join(dir, 'bin', exe);
  if (fs.existsSync(direct)) return direct;
  if (depth > 3) return null;
  for (const e of fs.readdirSync(dir, { withFileTypes: true }))
    if (e.isDirectory()) { const r = findJavaBin(path.join(dir, e.name), depth + 1); if (r) return r; }
  return null;
}
async function ensureJava(major) {
  const home = path.join(runtimeDir, `java-${major}`);
  if (fs.existsSync(home)) { const b = findJavaBin(home); if (b) { log(`Java ${major} найдена`); return b; } }
  log(`Java ${major} не найдена — скачиваю…`); prog(`Скачиваю Java ${major}…`, 0);
  const osName = { win32: 'windows', darwin: 'mac', linux: 'linux' }[process.platform];
  const arch = process.arch === 'arm64' ? 'aarch64' : 'x64';
  const isZip = process.platform === 'win32';
  const archive = path.join(runtimeDir, `java-${major}.${isZip ? 'zip' : 'tar.gz'}`);
  await download(`https://api.adoptium.net/v3/binary/latest/${major}/ga/${osName}/${arch}/jre/hotspot/normal/eclipse`, archive);
  log('Распаковываю Java…'); prog('Распаковываю Java…', 0.9);
  fs.mkdirSync(home, { recursive: true });
  if (isZip) await extract(archive, { dir: home }); else execFileSync('tar', ['-xzf', archive, '-C', home]);
  fs.rmSync(archive, { force: true });
  const bin = findJavaBin(home);
  if (!bin) throw new Error('Не удалось найти java после распаковки');
  if (!isZip) fs.chmodSync(bin, 0o755);
  return bin;
}

// ---------- загрузчики ----------
async function prepareLoader(inst) {
  const mc = inst.version;
  if (inst.loader === 'vanilla') return {};
  if (inst.loader === 'fabric') {
    let lv = inst.loaderVersion;
    if (!lv) {
      const list = await getJson(`https://meta.fabricmc.net/v2/versions/loader/${mc}`);
      if (!list.length) throw new Error(`Fabric не поддерживает ${mc}`);
      lv = list[0].loader.version;
    }
    const id = `fabric-loader-${lv}-${mc}`;
    const file = path.join(sharedDir, 'versions', id, `${id}.json`);
    if (!fs.existsSync(file)) {
      log(`Устанавливаю Fabric ${lv}…`); prog('Устанавливаю Fabric…', 0);
      const prof = await getJson(`https://meta.fabricmc.net/v2/versions/loader/${mc}/${lv}/profile/json`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(prof));
    }
    return { custom: id };
  }
  if (inst.loader === 'forge') {
    let fv = inst.loaderVersion;
    if (!fv) {
      const promos = (await getJson('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json')).promos;
      fv = promos[`${mc}-recommended`] || promos[`${mc}-latest`];
      if (!fv) throw new Error(`Forge не найден для ${mc}`);
    }
    const dest = path.join(root, 'forge', `forge-${mc}-${fv}-installer.jar`);
    if (!fs.existsSync(dest)) {
      log(`Скачиваю Forge ${fv}…`); prog('Скачиваю Forge…', 0);
      await download(`https://maven.minecraftforge.net/net/minecraftforge/forge/${mc}-${fv}/forge-${mc}-${fv}-installer.jar`, dest);
    }
    return { forge: dest };
  }
  throw new Error('Неизвестный загрузчик');
}

// ---------- запуск ----------
ipcMain.handle('play', async (_, id) => {
  if (child) throw new Error('Игра уже запущена');
  if (!cfg.account) throw new Error('Сначала войдите в аккаунт');
  const inst = byId(id);
  ensureGameDirs(inst);
  prog('Готовлю игру…', 0);
  const entry = (await getManifest()).versions.find(v => v.id === inst.version);
  if (!entry) throw new Error('Версия ' + inst.version + ' не найдена');
  const meta = await getJson(entry.url);
  const javaPath = await ensureJava(meta.javaVersion?.majorVersion || 8);
  const extra = await prepareLoader(inst);

  let authorization;
  if (cfg.account.type === 'microsoft') {
    prog('Проверяю аккаунт Microsoft…', 0);
    const r = await msRefresh();
    authorization = { access_token: r.mcToken, client_token: crypto.randomUUID(), uuid: r.id, name: r.name, user_properties: '{}', meta: { type: 'msa', demo: false } };
  } else {
    authorization = await Authenticator.getAuth(cfg.account.name);
    if (cfg.skinUuid) { authorization.uuid = cfg.skinUuid; log(`Скин игрока ${cfg.skinNick} (через его UUID, без модов)`); }
  }

  const launcher = new Client();
  launcher.on('debug', m => log(m));
  launcher.on('data', m => log(m));
  launcher.on('progress', p => prog(`Загрузка: ${p.type}`, p.total ? p.task / p.total : 0));
  launcher.on('close', code => { child = null; runningId = null; send('closed', code); log(`Игра закрыта (код ${code})`); });

  log(`Запускаю «${inst.name}»…`);
  const proc = await launcher.launch({
    authorization, root: sharedDir, javaPath,
    version: { number: inst.version, type: entry.type, ...(extra.custom ? { custom: extra.custom } : {}) },
    forge: extra.forge,
    memory: { max: `${inst.ram || cfg.ram}M`, min: '1024M' },
    customArgs: (inst.jvm || '').split(/\s+/).filter(Boolean),
    overrides: { gameDirectory: instDir(inst) },
  });
  if (!proc) throw new Error('Запуск не удался — смотрите журнал');
  child = proc; runningId = inst.id; inst.lastPlayed = Date.now(); saveInsts();
  prog('Игра запущена', 1);
  return true;
});
ipcMain.handle('stop', () => { if (child) child.kill(); });

// ---------- Modrinth ----------
const mrSearch = async (q, type, version, loader) => {
  const facets = [[`project_type:${type}`]];
  if (version) facets.push([`versions:${version}`]);
  if (loader && loader !== 'vanilla') facets.push([`categories:${loader}`]);
  const r = await getJson(`https://api.modrinth.com/v2/search?limit=24&query=${enc(q || '')}&facets=${enc(JSON.stringify(facets))}`);
  return r.hits.map(h => ({ id: h.project_id, title: h.title, desc: h.description, downloads: h.downloads, icon: h.icon_url, author: h.author }));
};
ipcMain.handle('mods-search', (_, { id, q }) => { const i = byId(id); return mrSearch(q, 'mod', i.version, i.loader); });
ipcMain.handle('packs-search', (_, q) => mrSearch(q, 'modpack'));
async function installMod(inst, pid, seen = new Set()) {
  if (seen.has(pid)) return [];
  seen.add(pid);
  let url = `https://api.modrinth.com/v2/project/${pid}/version?game_versions=${enc(JSON.stringify([inst.version]))}`;
  if (inst.loader !== 'vanilla') url += `&loaders=${enc(JSON.stringify([inst.loader]))}`;
  const vers = await getJson(url);
  if (!vers.length) throw new Error(`Нет версии мода для ${inst.version} / ${inst.loader}`);
  const v = vers[0], f = v.files.find(x => x.primary) || v.files[0];
  await download(f.url, path.join(sub(inst, 'mods'), f.filename));
  const done = [f.filename];
  for (const d of v.dependencies || [])
    if (d.dependency_type === 'required' && d.project_id) {
      try { done.push(...await installMod(inst, d.project_id, seen)); } catch (e) { log('Зависимость не установлена: ' + e.message); }
    }
  return done;
}
ipcMain.handle('mods-install', (_, { id, project }) => installMod(byId(id), project));

// ---------- Починить сборку ----------
ipcMain.handle('mods-repair', async (_, { id, priority }) => {
  const inst = byId(id);
  if (!inst) throw new Error('Сборка не найдена');
  const modsDir = sub(inst, 'mods');
  if (!fs.existsSync(modsDir)) return { fixed: 0, message: 'Папка модов пуста' };

  const files = fs.readdirSync(modsDir).filter(f => f.endsWith('.jar') || f.endsWith('.jar.disabled'));
  const priorityName = priority.replace(/\.disabled$/, '');
  let fixed = 0;
  const kept = [];

  // Удаляем все моды кроме приоритетного
  for (const f of files) {
    const base = f.replace(/\.disabled$/, '');
    if (base === priorityName || f === priority) {
      kept.push(f);
      continue;
    }
    try {
      fs.rmSync(path.join(modsDir, f), { force: true });
      fixed++;
    } catch {}
  }

  // Переустанавливаем приоритетный мод (подтянет зависимости)
  // Пытаемся найти project id по имени файла (упрощённо)
  let projectId = null;
  try {
    const search = await mrSearch(priorityName.replace(/[-_.]/g, ' '), 'mod', inst.version, inst.loader);
    if (search && search[0]) projectId = search[0].id;
  } catch {}

  if (projectId) {
    try {
      const installed = await installMod(inst, projectId);
      return { fixed, reinstalled: installed, message: `Удалено ${fixed} модов, переустановлен приоритетный` };
    } catch (e) {
      return { fixed, message: `Удалено ${fixed} модов, но не удалось переустановить приоритетный: ${e.message}` };
    }
  }

  return { fixed, message: `Удалено ${fixed} потенциально конфликтующих модов. Приоритетный оставлен.` };
});


async function installMrpack(file, nameHint) {
  const tmp = path.join(os.tmpdir(), 'tnt-mrpack-' + Date.now());
  try {
    await extract(file, { dir: tmp });
    const idx = JSON.parse(fs.readFileSync(path.join(tmp, 'modrinth.index.json'), 'utf8'));
    const d = idx.dependencies || {};
    if (d['quilt-loader'] || d.neoforge) throw new Error('Quilt и NeoForge пока не поддерживаются');
    const inst = createInst({
      name: nameHint || idx.name, version: d.minecraft,
      loader: d['fabric-loader'] ? 'fabric' : d.forge ? 'forge' : 'vanilla', loaderVersion: d['fabric-loader'] || d.forge || null,
    });
    const dir = path.resolve(instDir(inst));
    let n = 0;
    for (const f of idx.files) {
      n++;
      if (f.env && f.env.client === 'unsupported') continue;
      const dest = path.resolve(dir, f.path);
      if (!dest.startsWith(dir + path.sep)) continue;
      log(`Сборка «${inst.name}»: файл ${n}/${idx.files.length}`); prog(`Сборка «${inst.name}»: ${n}/${idx.files.length}`, n / idx.files.length);
      await download(f.downloads[0], dest);
    }
    for (const o of ['overrides', 'client-overrides']) {
      const s = path.join(tmp, o);
      if (fs.existsSync(s)) fs.cpSync(s, dir, { recursive: true });
    }
    log(`Сборка «${inst.name}» готова`);
    return inst;
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
ipcMain.handle('packs-install', async (_, { project, title }) => {
  const vers = await getJson(`https://api.modrinth.com/v2/project/${project}/version`);
  if (!vers.length) throw new Error('У сборки нет версий');
  const f = vers[0].files.find(x => x.primary) || vers[0].files[0];
  const tmp = path.join(os.tmpdir(), 'tnt-pack-' + Date.now() + '.mrpack');
  log('Скачиваю сборку…');
  await download(f.url, tmp);
  try { return await installMrpack(tmp, title); } finally { fs.rmSync(tmp, { force: true }); }
});
ipcMain.handle('packs-import', async () => {
  const r = await dialog.showOpenDialog(win, { filters: [{ name: 'Сборка Modrinth', extensions: ['mrpack'] }], properties: ['openFile'] });
  return r.canceled ? null : installMrpack(r.filePaths[0]);
});

// ---------- скины ----------
ipcMain.handle('skin-open', async () => {
  const r = await dialog.showOpenDialog(win, { filters: [{ name: 'PNG', extensions: ['png'] }], properties: ['openFile'] });
  return r.canceled ? null : 'data:image/png;base64,' + fs.readFileSync(r.filePaths[0]).toString('base64');
});
ipcMain.handle('skin-save', async (_, dataUrl) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: 'skin.png', filters: [{ name: 'PNG', extensions: ['png'] }] });
  if (r.canceled) return false;
  fs.writeFileSync(r.filePath, Buffer.from(dataUrl.split(',')[1], 'base64'));
  return true;
});
async function backupCurrentSkin(mc) {                                  // перед заменой сохраняем текущий скин аккаунта
  try {
    const prof = await getJson(`https://sessionserver.mojang.com/session/minecraft/profile/${mc.id}`);
    const tex = JSON.parse(Buffer.from(prof.properties.find(x => x.name === 'textures').value, 'base64').toString('utf8')).textures;
    if (!tex || !tex.SKIN) return false;
    const res = await fetch(tex.SKIN.url, { headers: UA });
    if (!res.ok) return false;
    const dir = path.join(root, 'skin-backups'); fs.mkdirSync(dir, { recursive: true });
    const id = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(dir, id + '.png'), Buffer.from(await res.arrayBuffer()));
    fs.writeFileSync(path.join(dir, id + '.json'), JSON.stringify({ slim: tex.SKIN.metadata?.model === 'slim' }));
    const old = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort().slice(0, -10);
    for (const f of old) { fs.rmSync(path.join(dir, f), { force: true }); fs.rmSync(path.join(dir, f.replace(/\.png$/, '.json')), { force: true }); }
    return true;
  } catch { return false; }
}
async function putSkin(mc, png, slim) {
  const fd = new FormData();
  fd.append('variant', slim ? 'slim' : 'classic');
  fd.append('file', new Blob([png], { type: 'image/png' }), 'skin.png');
  const r = await fetch('https://api.minecraftservices.com/minecraft/profile/skins', { method: 'POST', headers: { Authorization: `Bearer ${mc.mcToken}` }, body: fd });
  if (!r.ok) throw new Error(`Mojang ответил ${r.status}`);
}
ipcMain.handle('skin-upload', async (_, { dataUrl, slim }) => {
  if (cfg.account?.type !== 'microsoft') throw new Error('Загрузка скина работает только для аккаунта Microsoft');
  const mc = await msRefresh();
  const backedUp = await backupCurrentSkin(mc);
  await putSkin(mc, Buffer.from(dataUrl.split(',')[1], 'base64'), slim);
  return { backedUp };
});
ipcMain.handle('skin-restore', async () => {
  if (cfg.account?.type !== 'microsoft') throw new Error('Нужен аккаунт Microsoft');
  const dir = path.join(root, 'skin-backups');
  const last = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort().pop() : null;
  if (!last) throw new Error('Сохранённых прежних скинов нет. Вернуть скин можно на minecraft.net или через NameMC (история скинов).');
  const meta = (() => { try { return JSON.parse(fs.readFileSync(path.join(dir, last.replace(/\.png$/, '.json')), 'utf8')); } catch { return {}; } })();
  const png = fs.readFileSync(path.join(dir, last));
  await putSkin(await msRefresh(), png, !!meta.slim);
  return { dataUrl: 'data:image/png;base64,' + png.toString('base64'), slim: !!meta.slim };
});

// ---------- обновления из GitHub ----------
const REPO = 'tretyakivan102016-web/tnt-launcher';
const vnum = v => String(v).replace(/^v/i, '').split('-')[0].split('.').map(n => parseInt(n, 10) || 0);
const isNewer = (a, b) => { const x = vnum(a), y = vnum(b); for (let k = 0; k < Math.max(x.length, y.length); k++) { const d = (x[k] || 0) - (y[k] || 0); if (d) return d > 0; } return false; };
let pendingUpdate = null;
ipcMain.handle('update-check', async () => {
  try {
    const r = await getJson(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (!isNewer(r.tag_name, app.getVersion())) return { state: 'latest', version: app.getVersion() };
    const assets = r.assets || [];
    const pick = process.platform === 'win32' ? assets.find(a => /\.exe$/i.test(a.name))
      : process.platform === 'darwin' ? (assets.find(a => a.name.includes(process.arch) && /\.dmg$/i.test(a.name)) || assets.find(a => /\.dmg$/i.test(a.name)))
      : process.platform === 'linux' ? assets.find(a => /\.AppImage$/i.test(a.name)) : null;
    pendingUpdate = pick ? { url: pick.browser_download_url, name: pick.name } : null;
    return { state: 'new', version: r.tag_name.replace(/^v/i, ''), notes: (r.body || '').slice(0, 1200), page: r.html_url, hasAsset: !!pick };
  } catch (e) { return { state: 'error', error: String(e.message || e) }; }
});
ipcMain.handle('update-install', async () => {
  if (!pendingUpdate) throw new Error('В релизе нет установщика для вашей системы');
  const dest = path.join(app.getPath('temp'), pendingUpdate.name);
  // Сначала пробуем зеркало сайта (часто быстрее прямых ссылок GitHub), при сбое — GitHub напрямую.
  const mirrorKey = { win32: 'windows', darwin: 'mac', linux: 'linux' }[process.platform];
  let res = null;
  try { res = await fetch(siteBase() + '/mirror/' + mirrorKey, { headers: UA, redirect: 'follow' }); } catch {}
  if (!res || !res.ok || !res.body) res = await fetch(pendingUpdate.url, { headers: UA, redirect: 'follow' });
  if (!res.ok) throw new Error(`Не удалось скачать обновление (${res.status})`);
  const total = Number(res.headers.get('content-length')) || 0;
  const out = fs.createWriteStream(dest);
  const reader = res.body.getReader();
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out.write(value); got += value.length;
    send('update-progress', total ? got / total : 0);
  }
  await new Promise(r => out.end(r));
  if (process.platform === 'win32') {
    // тихая установка: без окон, в ту же папку, где лаунчер уже стоит; после установки лаунчер запускается сам
    spawn(dest, ['/S', '--updated', '--force-run'], { detached: true, stdio: 'ignore' }).unref();
    setTimeout(() => app.quit(), 700);
    return { quit: true };
  }
  if (process.platform === 'darwin') {
    // замена приложения на месте: монтируем образ, после закрытия лаунчера копируем новую версию поверх старой и запускаем
    const appPath = path.resolve(process.execPath, '..', '..', '..');
    let writable = false;
    try { fs.accessSync(path.dirname(appPath), fs.constants.W_OK); writable = /\.app$/.test(appPath); } catch {}
    if (writable) {
      const mnt = path.join(app.getPath('temp'), 'tnt-update-mnt');
      try {
        try { execFileSync('hdiutil', ['detach', mnt, '-force', '-quiet']); } catch {}
        fs.mkdirSync(mnt, { recursive: true });
        execFileSync('hdiutil', ['attach', dest, '-nobrowse', '-quiet', '-mountpoint', mnt]);
        const src = fs.readdirSync(mnt).find(f => f.endsWith('.app'));
        if (!src) throw new Error('В образе нет приложения');
        const script = 'while kill -0 "$PID" 2>/dev/null; do sleep 0.3; done; ' +
          'rm -rf "$DEST.new"; cp -R "$SRC" "$DEST.new" && rm -rf "$DEST" && mv "$DEST.new" "$DEST" && xattr -cr "$DEST"; ' +
          'hdiutil detach "$MNT" -quiet; open "$DEST"';
        spawn('/bin/bash', ['-c', script], { detached: true, stdio: 'ignore',
          env: { ...process.env, PID: String(process.pid), SRC: path.join(mnt, src), DEST: appPath, MNT: mnt } }).unref();
        setTimeout(() => app.quit(), 500);
        return { quit: true };
      } catch (e) { log('Автоматическая замена не удалась, открываю образ: ' + (e.message || e)); }
    }
  }
  if (process.platform === 'linux' && process.env.APPIMAGE) {                // заменяем файл AppImage на месте и запускаем новую версию
    try {
      const target = process.env.APPIMAGE, tmp = target + '.new';
      fs.copyFileSync(dest, tmp); fs.chmodSync(tmp, 0o755); fs.renameSync(tmp, target);
      spawn(target, [], { detached: true, stdio: 'ignore' }).unref();
      setTimeout(() => app.quit(), 500);
      return { quit: true };
    } catch (e) { log('Автоматическая замена не удалась: ' + (e.message || e)); }
  }
  await shell.openPath(dest);                     // запасной вариант: открыть скачанный файл вручную
  return { quit: false };
});
ipcMain.handle('open-release', () => shell.openExternal(`https://github.com/${REPO}/releases/latest`));

// ---------- скины: ник лицензии, офлайн-скин ----------
ipcMain.handle('skin-fetch', async (_, nick) => {
  nick = (nick || '').trim();
  if (!/^\w{3,16}$/.test(nick)) throw new Error('Введите ник: 3–16 символов, буквы, цифры и _');
  let prof;
  try {
    const p = await getJson(`https://api.mojang.com/users/profiles/minecraft/${enc(nick)}`);
    prof = await getJson(`https://sessionserver.mojang.com/session/minecraft/profile/${p.id}`);
  } catch { throw new Error('Игрок с таким ником не найден (или сервер Mojang просит подождать минуту)'); }
  const tex = JSON.parse(Buffer.from(prof.properties.find(x => x.name === 'textures').value, 'base64').toString('utf8')).textures;
  if (!tex || !tex.SKIN) throw new Error('У этого игрока стандартный скин, скачивать нечего');
  const r = await fetch(tex.SKIN.url, { headers: UA });
  if (!r.ok) throw new Error('Не удалось скачать скин');
  return { dataUrl: 'data:image/png;base64,' + Buffer.from(await r.arrayBuffer()).toString('base64'), slim: tex.SKIN.metadata?.model === 'slim', name: prof.name };
});
const CSL = 'idMHQ4n2';   // CustomSkinLoader на Modrinth
async function ensureCsl(inst) {
  if (inst.loader === 'vanilla') throw new Error('Для скинов нужен Fabric или Forge: выберите загрузчик в настройках сборки');
  const mods = sub(inst, 'mods');
  if (fs.readdirSync(mods).some(f => /customskinloader/i.test(f))) return false;
  await installMod(inst, CSL);
  return true;
}
ipcMain.handle('csl-install', async (_, id) => ensureCsl(byId(id)));
ipcMain.handle('skin-apply', async (_, { id, dataUrl }) => {
  const inst = byId(id);
  if (!cfg.account) throw new Error('Сначала выберите офлайн-аккаунт с ником');
  const installed = await ensureCsl(inst);
  const dir = path.join(instDir(inst), 'CustomSkinLoader', 'LocalSkin', 'skins');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${cfg.account.name}.png`), Buffer.from(dataUrl.split(',')[1], 'base64'));
  return { installed, nick: cfg.account.name };
});

// ---------- вход с сайта TnT Launcher ----------
const SITE_DEFAULT = 'https://tntlauncher.app';    // адрес сайта лаунчера (можно переопределить в настройках лаунчера)
const siteBase = () => (cfg.site || SITE_DEFAULT).replace(/\/+$/, '');
async function siteFetch(p, body, extra = {}) {
  const r = await fetch(siteBase() + p, {
    method: body ? 'POST' : 'GET', headers: { ...UA, 'X-TNT-Launcher': '1', 'Content-Type': 'application/json', ...extra },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(8000),
  });
  return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
}
ipcMain.handle('site-peek', async (_, code) => {
  try { const r = await siteFetch('/api/handoff/peek' + (code ? `?code=${enc(code)}` : '')); return r.ok && r.j.found ? { found: true, name: r.j.name, type: r.j.type } : { found: false }; }
  catch { return { found: false }; }
});
ipcMain.handle('site-claim', async (_, code) => {
  let r;
  try { r = await siteFetch('/api/handoff/claim', code ? { code } : {}); }
  catch { throw new Error('Не удалось связаться с сайтом. Проверьте адрес сайта в настройках.'); }
  if (!r.ok) throw new Error(r.j.message || `Сайт ответил ${r.status}`);
  if (r.j.type === 'offline') {                                          // вход по офлайн-нику с сайта
    cfg.account = { type: 'offline', name: r.j.name }; cfg.nick = r.j.name; saveCfg();
    return { type: 'offline', name: r.j.name };
  }
  const prev = cfg.account;
  cfg.account = { type: 'microsoft', name: r.j.name, uuid: r.j.uuid, refresh_token: r.j.refresh_token, scope: r.j.scope };
  try { await msRefresh(); }                         // проверяем аккаунт и сразу обновляем ключ
  catch (e) { cfg.account = prev; throw new Error('Аккаунт с сайта не прошёл проверку: ' + (e.message || e)); }
  saveCfg();
  return { type: 'microsoft', name: cfg.account.name };
});
ipcMain.handle('site-open', () => shell.openExternal(siteBase()));
ipcMain.handle('set-site', (_, url) => {
  url = (url || '').trim();
  if (url && !/^https?:\/\//i.test(url)) throw new Error('Адрес должен начинаться с http:// или https://');
  cfg.site = url || null; saveCfg(); return siteBase();
});

// ---------- скин: сохранение редактора и скин по нику лицензии ----------
const skinFile = path.join(root, 'skin.png');
ipcMain.handle('skin-state-get', () => ({
  dataUrl: fs.existsSync(skinFile) ? 'data:image/png;base64,' + fs.readFileSync(skinFile).toString('base64') : null,
  slim: !!cfg.skinSlim,
}));
ipcMain.handle('skin-state-set', (_, { dataUrl, slim }) => {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) return;
  fs.writeFileSync(skinFile, Buffer.from(dataUrl.split(',')[1], 'base64'));
  if (!!cfg.skinSlim !== !!slim) { cfg.skinSlim = !!slim; saveCfg(); }
});
ipcMain.handle('set-skin-nick', async (_, nick) => {
  nick = (nick || '').trim();
  if (!nick) { cfg.skinNick = null; cfg.skinUuid = null; saveCfg(); return { name: null }; }
  if (!/^\w{3,16}$/.test(nick)) throw new Error('Ник: 3–16 символов, буквы, цифры и _');
  let p;
  try { p = await getJson(`https://api.mojang.com/users/profiles/minecraft/${enc(nick)}`); }
  catch { throw new Error('Игрок с таким ником не найден (или Mojang просит подождать минуту)'); }
  cfg.skinNick = p.name; cfg.skinUuid = p.id; saveCfg();
  return { name: p.name };
});

// ---------- удаление лаунчера ----------
function dirSize(p) { let s = 0; try { for (const e of fs.readdirSync(p, { withFileTypes: true })) { const fp = path.join(p, e.name); s += e.isDirectory() ? dirSize(fp) : (e.isFile() ? (fs.statSync(fp).size || 0) : 0); } } catch {} return s; }
const worldList = () => {
  const out = [];
  for (const i of insts) {
    const d = path.join(instDir(i), 'saves');
    if (!fs.existsSync(d)) continue;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) out.push({ inst: i.name, instDir: i.dir || i.id, world: e.name });
  }
  return out;
};
const runtimeList = () => {                       // загруженные версии Java: их по умолчанию НЕ удаляем
  if (!fs.existsSync(runtimeDir)) return [];
  return fs.readdirSync(runtimeDir, { withFileTypes: true }).filter(e => e.isDirectory() && /^java-/.test(e.name))
    .map(e => ({ major: e.name.slice(5), sizeMB: Math.round(dirSize(path.join(runtimeDir, e.name)) / 1048576) }));
};
ipcMain.handle('uninstall-scan', () => ({ worlds: worldList(), runtimes: runtimeList() }));
ipcMain.handle('pick-dir', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Куда сохранить миры', properties: ['openDirectory', 'createDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('uninstall-run', async (_, { keep = [], dest, removeRuntimes = [] } = {}) => {
  if (child) throw new Error('Сначала закройте игру');
  if (path.basename(root) !== '.tntlauncher') throw new Error('Неожиданный путь данных — удаление отменено');
  let savedTo = null;
  if (keep.length) {
    if (!dest) throw new Error('Не выбрана папка для сохранения миров');
    const d = path.resolve(dest), r0 = path.resolve(root);
    if (d === r0 || d.startsWith(r0 + path.sep)) throw new Error('Выберите папку вне данных лаунчера');
    const real = new Set(worldList().map(w => `${w.instDir}\u0000${w.world}`));
    savedTo = path.join(d, 'TnT Launcher — сохранённые миры');
    await fs.promises.mkdir(savedTo, { recursive: true });
    for (const k of keep) {
      if (!real.has(`${k.instDir}\u0000${k.world}`)) continue;              // только реальные миры из списка
      const src = path.join(instRoot, k.instDir, 'saves', k.world);
      const base = `${k.inst} — ${k.world}`.replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_');
      let t = path.join(savedTo, base), n = 2;
      while (fs.existsSync(t)) t = path.join(savedTo, `${base} (${n++})`);
      await fs.promises.cp(src, t, { recursive: true });
      if (!fs.existsSync(t)) throw new Error(`Не удалось сохранить мир «${k.world}». Ничего не удалено.`);
    }
  }
  // всё сохранено — удаляем данные TnT Launcher (другие лаунчеры, .minecraft и Bedrock не трогаем).
  // Папку runtime с Java НЕ удаляем целиком: убираем только выбранные пользователем версии.
  for (const e of fs.readdirSync(root)) {
    if (e === 'runtime') continue;
    await fs.promises.rm(path.join(root, e), { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
  if (fs.existsSync(runtimeDir)) {
    for (const maj of removeRuntimes) {
      const safe = String(maj).replace(/[^0-9a-z-]/gi, '');
      if (safe) await fs.promises.rm(path.join(runtimeDir, 'java-' + safe), { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }).catch(() => {});
    }
    try { if (!fs.readdirSync(runtimeDir).length) await fs.promises.rm(runtimeDir, { recursive: true, force: true }); } catch {}
  }
  try { await fs.promises.rm(app.getPath('userData'), { recursive: true, force: true }); } catch {}
  try { app.removeAsDefaultProtocolClient('tntlauncher'); } catch {}
  if (app.isPackaged) {
    if (process.platform === 'win32') {
      const un = path.join(path.dirname(process.execPath), 'Uninstall TnT Launcher.exe');
      if (fs.existsSync(un)) spawn(un, ['/S'], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      const appPath = path.resolve(process.execPath, '..', '..', '..');
      if (/\.app$/.test(appPath)) { try { await shell.trashItem(appPath); } catch {} }
    }
  }
  setTimeout(() => app.exit(0), 900);
  return { ok: true, savedTo };
});

// ---------- Minecraft Bedrock Edition ----------
const execFileP = require('util').promisify(require('child_process').execFile);
const beGdk = () => path.join(process.env.APPDATA || '', 'Minecraft Bedrock', 'Users', 'Shared', 'games', 'com.mojang');
const beUwp = () => path.join(process.env.LOCALAPPDATA || '', 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang');
function bedrockDir() {
  if (process.platform !== 'win32') return null;
  for (const d of [beGdk(), beUwp()]) if (fs.existsSync(d)) return d;
  return null;
}
const BE_KINDS = ['resource_packs', 'behavior_packs', 'skin_packs', 'minecraftWorlds', 'world_templates'];
const beKind = k => { if (!BE_KINDS.includes(k)) throw new Error('Неверный раздел'); return k; };
const readJsonLoose = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '')); } catch { return null; } };

// Сборки Bedrock: у каждой свой набор паков и миров в ~/.tntlauncher/instances/<имя>.
// Папка данных у самой игры одна — при запуске сборка «применяется»: её содержимое копируется в игру.
const beProfileDir = i => { const d = instDir(i); fs.mkdirSync(d, { recursive: true }); BE_KINDS.forEach(k => fs.mkdirSync(path.join(d, k), { recursive: true })); return d; };
const beTarget = id => { if (!id) return bedrockDir(); const i = byId(id); if (i.kind !== 'bedrock') throw new Error('Это не сборка Bedrock'); return beProfileDir(i); };
async function applyBedrockProfile(i) {
  const game = bedrockDir();
  if (!game) throw new Error('Папка данных Minecraft Bedrock не найдена. Запустите игру хотя бы раз.');
  const from = beProfileDir(i);
  let n = 0;
  for (const kind of BE_KINDS) {
    const src = path.join(from, kind);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(game, kind);
    fs.mkdirSync(dst, { recursive: true });
    for (const e of fs.readdirSync(src, { withFileTypes: true })) {
      await fs.promises.cp(path.join(src, e.name), path.join(dst, e.name), { recursive: true, force: true });
      n++;
    }
  }
  log(`Сборка «${i.name}» применена: скопировано элементов ${n}`);
  return n;
}

ipcMain.handle('be-info', async () => {
  if (process.platform !== 'win32') return { supported: false };
  let version = null;
  try {
    const r = await execFileP('powershell', ['-NoProfile', '-Command', '(Get-AppxPackage -Name Microsoft.MinecraftUWP | Select-Object -First 1).Version'], { timeout: 9000, windowsHide: true });
    version = String(r.stdout || '').trim() || null;
  } catch {}
  const dir = bedrockDir();
  return { supported: true, installed: !!version || !!dir, version, dir, hasKey: !!cfg.curseKey };
});
ipcMain.handle('be-play', async (_, { profile } = {}) => {
  if (process.platform !== 'win32') throw new Error('Bedrock Edition доступен только на Windows');
  if (profile) await applyBedrockProfile(byId(profile));
  const info = bedrockDir() || (await execFileP('powershell', ['-NoProfile', '-Command', '(Get-AppxPackage -Name Microsoft.MinecraftUWP | Select-Object -First 1).Name'], { timeout: 9000, windowsHide: true }).then(r => String(r.stdout).trim()).catch(() => ''));
  if (info) { await shell.openExternal('minecraft://'); return { opened: 'game' }; }
  await shell.openExternal('ms-windows-store://pdp/?productid=9NBLGGH2JHXJ');
  return { opened: 'store' };
});
ipcMain.handle('be-apply', async (_, id) => ({ applied: await applyBedrockProfile(byId(id)) }));
ipcMain.handle('be-open', (_, { sub, id }) => {
  const d = beTarget(id); if (!d) throw new Error('Папка данных Bedrock не найдена. Запустите игру хотя бы раз.');
  const t = sub ? path.join(d, beKind(sub)) : d;
  fs.mkdirSync(t, { recursive: true });
  return shell.openPath(t);
});
ipcMain.handle('be-list', (_, { kind, id }) => {
  let d;
  if (id) d = beTarget(id);
  else { d = bedrockDir(); if (!d) return []; }
  const dir = path.join(d, beKind(kind));
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => {
    const p = path.join(dir, e.name);
    let name = e.name;
    if (kind === 'minecraftWorlds') { try { name = fs.readFileSync(path.join(p, 'levelname.txt'), 'utf8').trim() || name; } catch {} }
    else { const mf = readJsonLoose(path.join(p, 'manifest.json')); const n = mf && mf.header && mf.header.name; if (n && !/^(pack\.|%)/.test(n)) name = n; }
    return { folder: e.name, name };
  });
});
ipcMain.handle('be-delete', async (_, { kind, folder, id }) => {
  const d = beTarget(id); if (!d) throw new Error('Папка данных Bedrock не найдена');
  await fs.promises.rm(safeIn(path.join(d, beKind(kind)), folder), { recursive: true, force: true });
});

// установка .mcpack / .mcaddon / .mcworld / .mctemplate (это обычные zip-архивы)
const cleanName = s => String(s || 'pack').replace(/[<>:"\/\\|?*\x00-\x1f]/g, '').replace(/[. ]+$/, '').trim().slice(0, 50) || 'pack';
function freeName(dir, name) { let n = name, i = 2; while (fs.existsSync(path.join(dir, n))) n = `${name} (${i++})`; return n; }
async function installPackDir(src, base, results) {
  const mf = readJsonLoose(path.join(src, 'manifest.json')) || {};
  const types = ((mf.modules || []).map(x => String(x.type || '').toLowerCase()));
  const kind = types.includes('skin_pack') ? 'skin_packs' : types.some(t => t === 'data' || t === 'script' || t === 'client_data') ? 'behavior_packs'
    : types.includes('world_template') ? 'world_templates' : 'resource_packs';
  const dir = path.join(base, kind);
  await fs.promises.mkdir(dir, { recursive: true });
  const uuid = mf.header && mf.header.uuid;
  let target = null;
  if (uuid && fs.existsSync(dir)) {                                           // та же версия пака уже стоит — обновляем её
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) {
      const o = readJsonLoose(path.join(dir, e.name, 'manifest.json'));
      if (o && o.header && o.header.uuid === uuid) { target = path.join(dir, e.name); break; }
    }
  }
  const title = (mf.header && mf.header.name && !/^(pack\.|%)/.test(mf.header.name)) ? mf.header.name : path.basename(src);
  if (target) await fs.promises.rm(target, { recursive: true, force: true });
  else target = path.join(dir, freeName(dir, `${cleanName(title)}_${String(uuid || crypto.randomBytes(4).toString('hex')).slice(0, 8)}`));
  await fs.promises.cp(src, target, { recursive: true });
  results.push(`${{ resource_packs: 'Ресурспак', behavior_packs: 'Аддон', skin_packs: 'Скин-пак', world_templates: 'Шаблон' }[kind]}: ${title}`);
}
async function installPacksFrom(dir, base, results, depth) {
  if (fs.existsSync(path.join(dir, 'manifest.json'))) return installPackDir(dir, base, results);
  if (depth > 4) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await installPacksFrom(p, base, results, depth + 1);
    else if (/\.(mcpack|mcaddon|zip)$/i.test(e.name)) {
      const sub = fs.mkdtempSync(path.join(os.tmpdir(), 'tnt-be-n-'));
      try { await extract(p, { dir: sub }); await installPacksFrom(sub, base, results, depth + 2); } finally { fs.rmSync(sub, { recursive: true, force: true }); }
    }
  }
}
async function installBedrockFile(file, base) {
  base = base || bedrockDir();
  if (!base) throw new Error('Не найдена папка данных Minecraft Bedrock. Запустите игру хотя бы один раз.');
  const ext = path.extname(file).toLowerCase(), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tnt-be-')), results = [];
  try {
    await extract(file, { dir: tmp });
    if (ext === '.mcworld' || ext === '.mctemplate') {
      const kind = ext === '.mcworld' ? 'minecraftWorlds' : 'world_templates', dir = path.join(base, kind);
      await fs.promises.mkdir(dir, { recursive: true });
      let nm = path.basename(file, ext); try { nm = fs.readFileSync(path.join(tmp, 'levelname.txt'), 'utf8').trim() || nm; } catch {}
      const t = freeName(dir, cleanName(nm));
      await fs.promises.cp(tmp, path.join(dir, t), { recursive: true });
      results.push(`${ext === '.mcworld' ? 'Мир' : 'Шаблон мира'}: ${nm}`);
    } else await installPacksFrom(tmp, base, results, 0);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  if (!results.length) throw new Error('В файле не найдено паков Bedrock (нет manifest.json)');
  return results;
}
ipcMain.handle('be-install-file', async (_, { id } = {}) => {
  const r = await dialog.showOpenDialog(win, { title: 'Файлы Bedrock', filters: [{ name: 'Bedrock', extensions: ['mcpack', 'mcaddon', 'mcworld', 'mctemplate', 'zip'] }], properties: ['openFile', 'multiSelections'] });
  if (r.canceled) return [];
  const base = beTarget(id);
  const out = [];
  for (const f of r.filePaths) out.push(...await installBedrockFile(f, base));
  return out;
});

// каталог аддонов Bedrock: CurseForge (нужен бесплатный ключ разработчика)
ipcMain.handle('set-curse-key', (_, key) => { cfg.curseKey = String(key || '').trim() || null; saveCfg(); return !!cfg.curseKey; });
async function cf(p) {
  if (!cfg.curseKey) throw new Error('Нужен бесплатный ключ CurseForge: вставьте его во вкладке «Настройки» Bedrock');
  const r = await fetch('https://api.curseforge.com' + p, { headers: { ...UA, 'x-api-key': cfg.curseKey, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (r.status === 401 || r.status === 403) throw new Error('CurseForge не принял ключ. Проверьте его в настройках Bedrock.');
  if (!r.ok) throw new Error('CurseForge: ошибка ' + r.status);
  return r.json();
}
let cfBedrockId = null;
async function bedrockGameId() {
  if (cfBedrockId) return cfBedrockId;
  try { const g = (await cf('/v1/games/78022')).data; if (g && /bedrock/i.test(`${g.slug} ${g.name}`)) return cfBedrockId = g.id; } catch (e) { if (/ключ/.test(e.message)) throw e; }
  for (let idx = 0; idx < 250; idx += 50) {
    const j = await cf(`/v1/games?index=${idx}&pageSize=50`);
    const g = (j.data || []).find(x => /bedrock/i.test(`${x.slug} ${x.name}`) && /minecraft/i.test(`${x.slug} ${x.name}`));
    if (g) return cfBedrockId = g.id;
    if (!j.data || j.data.length < 50) break;
  }
  throw new Error('Не нашёл раздел Minecraft Bedrock на CurseForge');
}
ipcMain.handle('be-search', async (_, q) => {
  const gid = await bedrockGameId();
  const j = await cf(`/v1/mods/search?gameId=${gid}&searchFilter=${enc(q || '')}&sortField=2&sortOrder=desc&pageSize=24`);
  return (j.data || []).map(x => ({ id: x.id, title: x.name, desc: x.summary, downloads: x.downloadCount, icon: x.logo && x.logo.thumbnailUrl, author: x.authors && x.authors[0] && x.authors[0].name, url: x.links && x.links.websiteUrl }));
});
ipcMain.handle('be-install-mod', async (_, { id, url, profile }) => {
  const files = (await cf(`/v1/mods/${Number(id)}/files?pageSize=10`)).data || [];
  const f = files.filter(x => x.isAvailable !== false).sort((a, b) => new Date(b.fileDate) - new Date(a.fileDate))[0];
  if (!f) throw new Error('У этого аддона нет доступных файлов');
  let dl = f.downloadUrl;
  if (!dl) { try { dl = (await cf(`/v1/mods/${Number(id)}/files/${f.id}/download-url`)).data; } catch {} }
  if (!dl) { if (url && /^https:\/\//.test(url)) shell.openExternal(url); return { manual: true }; }   // автор запретил скачивание сторонними программами
  const tmp = path.join(os.tmpdir(), `tnt-be-${Date.now()}-${String(f.fileName).replace(/[^\w.\-]/g, '_')}`);
  try { await download(dl, tmp); return { manual: false, results: await installBedrockFile(tmp, profile ? beTarget(profile) : undefined) }; }
  finally { fs.rmSync(tmp, { force: true }); }
});

// ---------- сообщить о проблеме и ответы разработчиков ----------
// Сообщения уходят на сайт, а в Telegram их пересылает сервер. Токена бота в лаунчере нет и быть не должно.
const FORUM_URL = 'https://forum.tntlauncher.app';
let bearerCache = { t: null, exp: 0 };
async function launcherAuth() {                       // для лицензионного аккаунта подтверждаем, кто пишет (токен Minecraft), для остальных — по IP
  if (!cfg.account || cfg.account.type !== 'microsoft') return {};
  if (!bearerCache.t || bearerCache.exp < Date.now()) {
    try { const r = await msRefresh(); bearerCache = { t: r.mcToken, exp: Date.now() + 15 * 60 * 1000 }; } catch { return {}; }
  }
  return { Authorization: `Bearer ${bearerCache.t}` };
}
ipcMain.handle('report-send', async (_, { where, text }) => {
  let r;
  try { r = await siteFetch('/api/report', { where: where === 'site' ? 'site' : 'launcher', text, source: 'launcher', app: { version: app.getVersion(), platform: process.platform } }, await launcherAuth()); }
  catch { throw new Error('Не удалось связаться с сайтом. Проверьте интернет и адрес сайта в настройках.'); }
  if (!r.ok) throw new Error(r.j.message || `Сайт ответил ${r.status}`);
  cfg.rids = [...(cfg.rids || []), r.j.rid].slice(-50); saveCfg();
  return { id: r.j.id };
});
ipcMain.handle('notif-fetch', async () => {
  try { const r = await siteFetch('/api/notifications?rids=' + enc((cfg.rids || []).join(',')), null, await launcherAuth()); return r.ok ? (r.j.list || []) : []; }
  catch { return []; }
});
ipcMain.handle('notif-ack', async (_, id) => { try { await siteFetch('/api/notifications/ack', { id, rids: cfg.rids || [] }, await launcherAuth()); } catch {} });
ipcMain.handle('open-forum', (_, { title, body }) => {
  clipboard.writeText(String(body || ''));            // запасной вариант: если форум не подставит текст сам, его можно вставить
  const q = new URLSearchParams({ title: String(title || ''), body: String(body || '') });
  return shell.openExternal(`${FORUM_URL}/new-topic?${q}`);
});
ipcMain.handle('open-forum-home', () => shell.openExternal(FORUM_URL));
