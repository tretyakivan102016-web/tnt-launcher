'use strict';
const api = window.tnt;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const errMsg = e => String((e && e.message) || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
// ---------- i18n ----------
const I18N = {
  ru: {
    // общие
    'common.search': 'Найти', 'common.save': 'Сохранить', 'common.cancel': 'Отмена', 'common.no': 'Нет', 'common.yes': 'Да',
    'common.delete': 'Удалить', 'common.install': 'Установить', 'common.installed': 'Установлено', 'common.saved': 'Сохранено',
    'common.send': 'Отправить', 'common.close': 'Закрыть', 'common.apply': 'Применить', 'common.reset': 'Сбросить',
    'common.forum': 'Форум', 'common.settings': 'Настройки', 'common.searching': 'Ищу…', 'common.checking': 'Проверяю…',
    'common.notFound': 'Ничего не найдено',
    // боковая панель
    'side.title': 'МОИ СБОРКИ', 'side.bedrock': 'BEDROCK', 'side.for': 'для Minecraft', 'side.new': 'Новая',
    'nav.catalog': 'Каталог сборок', 'nav.skin': 'Редактор скина', 'nav.account': 'Аккаунт и настройки',
    'acct.guest': 'Гость', 'acct.none': 'аккаунт не выбран', 'acc.offlineShort': 'офлайн',
    // запуск
    'play': 'ИГРАТЬ', 'stop': 'СТОП', 'launching': 'ЗАПУСК…', 'prog.ready': 'Готов к запуску',
    'q.folder': 'Папка игры', 'q.folderTitle': 'Открыть папку игры', 'q.mods': 'Моды', 'q.rp': 'Ресурспаки', 'q.shaders': 'Шейдеры', 'q.saves': 'Миры',
    'tab.files': 'Файлы', 'tab.mods': 'Установка модов', 'tab.set': 'Настройки сборки', 'tab.log': 'Журнал',
    // файлы
    'files.add': 'Добавить файлы', 'files.open': 'Открыть папку', 'files.root': 'Папка сборки',
    'files.empty': 'Здесь пока пусто', 'files.enable': 'Включить', 'files.disable': 'Выключить', 'files.disabledSuffix': ' · выключен',
    // моды
    'mods.hint': 'Моды Modrinth под версию и загрузчик этой сборки. Нужные зависимости ставятся сами.',
    'mods.example': 'Например: Sodium, JEI, Iris…', 'mods.recommended': 'Рекомендуемые моды',
    'mods.noRec': 'Нет рекомендаций для этой версии', 'mods.notFound': 'Ничего не найдено для этой версии и загрузчика',
    'mods.vanillaWarn': 'В сборке Vanilla моды не работают — выберите Fabric или Forge в настройках сборки',
    'deps.title': 'Установить зависимости?', 'deps.ask': 'Этот мод может требовать зависимости. Установить их?', 'deps.never': 'Больше не спрашивать',
    'repair.title': 'Починить сборку', 'repair.select': 'Выберите один приоритетный мод. Остальные будут удалены, а приоритетный переустановлен.',
    'repair.none': 'Нет модов', 'repair.pick': 'Выберите мод', 'repair.working': 'Чиним сборку…', 'repair.go': 'Починить', 'repair.done': 'Сборка починена',
    // настройки сборки
    'set.name': 'Название', 'set.version': 'Версия Minecraft', 'set.color': 'Цвет сборки', 'set.loader': 'Загрузчик',
    'set.ram': 'Память (RAM)', 'set.shared': 'общая', 'set.jvm': 'Аргументы JVM', 'set.delete': 'Удалить сборку',
    'set.renameLocked': 'Остановите игру, чтобы переименовать сборку',
    'confirm.deleteInst': 'Удалить «{name}» вместе с модами и мирами?',
    'new.title': 'Новая сборка', 'new.namePh': 'Необязательно', 'new.version': 'Версия', 'new.snapshots': 'показать снапшоты и старые версии', 'new.create': 'Создать',
    'inst.none': 'Сборок пока нет', 'inst.noneHint': 'создайте первую кнопкой «Новая» слева',
    // каталог
    'cat.hint': 'Готовые сборки Modrinth ставятся отдельной сборкой со своими модами. Можно импортировать и свой файл .mrpack.',
    'cat.example': 'Например: Fabulously Optimized, Better MC…', 'cat.import': 'Импорт .mrpack',
    'cat.installed': 'Сборка «{name}» установлена',
    // bedrock
    'bedrock.unsupported': 'Bedrock Edition поддерживается только на Windows. На этой системе доступна только Java Edition.',
    'be.folder': 'Папка данных', 'be.addons': 'Аддоны', 'be.skins': 'Скин-паки', 'be.tabFiles': 'Содержимое', 'be.tabCat': 'Каталог аддонов',
    'be.installFile': 'Установить файл',
    'be.filesHint': 'Поддерживаются файлы .mcaddon, .mcpack, .mcworld и .mctemplate. После установки включите пак в настройках мира. Если игра открыта, перезапустите её.',
    'be.catHint': 'Аддоны и паки для Bedrock с CurseForge. Нужен бесплатный ключ (вкладка «Настройки»). Если автор запретил скачивание из программ, откроется его страница: скачайте файл и нажмите «Установить файл».',
    'be.example': 'Например: furniture, dragons, shaders…',
    'be.keyTitle': 'Ключ CurseForge', 'be.keyHint': 'Бесплатный ключ нужен только для поиска и скачивания аддонов из каталога. Получите его на console.curseforge.com (вход через аккаунт), вставьте сюда и сохраните.',
    'be.keyPh': 'Ключ CurseForge', 'be.getKey': 'Получить ключ', 'be.keySaved': 'Ключ сохранён', 'be.keyRemoved': 'Ключ удалён',
    'be.aboutTitle': 'О Bedrock в лаунчере',
    'be.about': 'Саму игру Bedrock нужно купить и установить из Microsoft Store: лаунчер её не скачивает. Он запускает игру, управляет её паками и мирами и ставит аддоны. Редактор скинов для Bedrock не работает. Bedrock есть только на Windows.',
    'be.checking': 'проверяю…', 'be.winOnly': 'только Windows', 'be.installed': 'Установлена', 'be.notInstalled': 'Не установлена',
    'be.dirFound': 'папка данных найдена', 'be.noDir': 'папки данных нет',
    'be.noteNotInstalledT': 'Игра Bedrock не найдена', 'be.noteNotInstalledS': 'Купите и установите Minecraft for Windows из Microsoft Store. Кнопка «Играть» откроет страницу магазина.',
    'be.noteNoDirT': 'Папка данных ещё не создана', 'be.noteNoDirS': 'Запустите игру один раз через кнопку «Играть», затем вернитесь сюда: управление паками и мирами заработает.',
    'be.noDirEmpty': 'Папка данных Bedrock пока не найдена', 'be.emptyPrefix': 'Нет', 'be.emptyRp': 'ресурспаков', 'be.emptyBp': 'аддонов', 'be.emptySp': 'скин-паков', 'be.emptyWorlds': 'миров',
    'be.launching': 'Запускаю Minecraft Bedrock…', 'be.store': 'Открыл страницу Minecraft в Microsoft Store',
    'be.manual': 'Автор запретил автоскачивание: открыл его страницу. Скачайте файл и нажмите «Установить файл».', 'be.manualBtn': 'Скачайте вручную',
    'be.delConfirm': 'Удалить «{name}»? Это нельзя отменить.',
    // скин
    'skin.hint': 'Рисуйте прямо на 3D-модели: крутите её мышью, колесо — масштаб. Ctrl+Z отменяет, Ctrl+Y возвращает.',
    'skin.view3d': '3D-модель', 'skin.view2d': 'Развёртка', 'skin.base': 'Основа', 'skin.overlay': 'Накладка',
    'skin.showOverlay': 'показывать накладку', 'skin.undo': '↶ Отменить', 'skin.redo': '↷ Вернуть',
    'skin.front': 'Спереди', 'skin.back': 'Сзади', 'skin.left': 'Слева', 'skin.right': 'Справа', 'skin.spin': 'Вращать',
    'tool.pen': 'Кисть', 'tool.erase': 'Ластик', 'tool.fill': 'Заливка', 'tool.pick': 'Пипетка',
    'skin.customColor': 'Свой цвет', 'skin.slim': 'тонкие руки (Alex)', 'skin.guide': 'разметка частей тела',
    'skin.nickPh': 'Ник лицензии', 'skin.fetch': 'Взять скин', 'skin.openPng': 'Открыть PNG', 'skin.clear': 'Очистить',
    'skin.upload': 'Загрузить в аккаунт Microsoft', 'skin.restore': 'Вернуть прежний скин аккаунта',
    'skin.apply': 'Играть с этим скином (офлайн)', 'skin.csl': 'Включить скины с лицензии',
    'skin.restoreTitle': 'Вернёт скин, который был на аккаунте до вашей последней загрузки',
    'skin.applyTitle': 'Ставит CustomSkinLoader и кладёт скин в сборку',
    'skin.cslTitle': 'Ваш ник совпадает с ником лицензии — скин подтянется сам',
    'skin.saved': 'Скин сохранён',
    'skin.uploadConfirm': 'Это ИЗМЕНИТ скин вашего аккаунта Microsoft везде: в других лаунчерах (например Lunar Client) и на серверах.\n\nПрежний скин сохранится, и его можно вернуть кнопкой «Вернуть прежний скин аккаунта».\n\nПродолжить?',
    'skin.uploaded': 'Скин загружен в аккаунт. Прежний скин сохранён.', 'skin.uploadedNoBackup': 'Скин загружен в аккаунт (прежний сохранить не удалось).',
    'skin.restoreConfirm': 'Вернуть на аккаунт скин, который был до вашей последней загрузки из лаунчера?',
    'skin.restored': 'Прежний скин возвращён на аккаунт и открыт в редакторе',
    'skin.fetched': 'Скин игрока {name} загружен в редактор',
    'skin.applied': 'Скин для ника {nick} добавлен в сборку', 'skin.cslInstalled': ' (установлен CustomSkinLoader)',
    'skin.cslInstalledMsg': 'CustomSkinLoader установлен: скины лицензионных игроков подтянутся по нику',
    'skin.cslPresent': 'CustomSkinLoader уже стоит в этой сборке',
    // аккаунт
    'acc.offlineTitle': 'Офлайн-режим', 'acc.offlineHint': 'Для одиночной игры и серверов без проверки лицензии.',
    'acc.nickPh': 'Ник (3–16 символов)', 'acc.playOffline': 'Играть офлайн',
    'acc.msTitle': 'Аккаунт Microsoft', 'acc.msHint': 'Для лицензионной игры. Адреса копировать не нужно.',
    'acc.loginCode': 'Войти по коду', 'acc.loginWindow': 'Войти через окно', 'acc.logout': 'Выйти из аккаунта',
    'acc.devStep1': 'Откройте', 'acc.devStep2': '(мы уже открыли его в браузере) и введите код:',
    'acc.copyCode': 'Скопировать код', 'acc.waiting': ' ждём подтверждения', 'acc.copied': 'Код скопирован',
    'acc.siteTitle': 'Вход с сайта',
    'acc.siteHint': 'Войдите через Microsoft на сайте TnT Launcher — и аккаунт появится здесь: лаунчер находит его по IP-адресу, по кнопке на сайте или по коду.',
    'acc.openSite': 'Открыть сайт', 'acc.findAccount': 'Найти аккаунт с сайта', 'acc.codePh': 'Код с сайта (XXXX-XXXX)', 'acc.loginByCode': 'Войти по коду',
    'acc.urlPh': 'Адрес сайта (по умолчанию https://tntlauncher.app)', 'acc.saveUrl': 'Сохранить адрес', 'acc.urlSaved': 'Адрес сайта сохранён',
    'acc.updTitle': 'Обновления', 'acc.updHint': 'Версия лаунчера:', 'acc.updHint2': 'Новые версии берутся с GitHub.', 'acc.checkUpd': 'Проверить обновления',
    'acc.skinTitle': 'Скин без модов',
    'acc.skinHint': 'В офлайн-режиме игра покажет скин лицензионного игрока с этим ником: без модов, в одиночной игре и в мире «для сети». Это ваш скин, если вы введёте ник своего лицензионного аккаунта (или любого другого). На серверах скин увидят другие игроки только при входе через Microsoft: загрузите скин в аккаунт во вкладке «Скин».',
    'acc.skinNickPh': 'Ник лицензии, например Notch',
    'acc.skinNickNone': 'Не задан: в офлайн-режиме будет стандартный скин.',
    'acc.skinNickSet': 'Сейчас используется скин игрока {name} (офлайн-режим).',
    'acc.skinNickSaved': 'Скин игрока {name} будет в игре', 'acc.skinNickCleared': 'Скин сброшен',
    'acc.ramTitle': 'Память по умолчанию', 'acc.ramHint': 'В настройках каждой сборки можно задать свою.',
    'acc.reportTitle': 'Сообщить о проблеме',
    'acc.reportHint': 'Расскажите, что не так: сообщение уйдёт разработчикам. Мы сохраним ваш IP-адрес (и ник, если вы вошли через Microsoft), чтобы сообщить о решении. Ответ придёт сюда или на сайт.',
    'acc.whereLabel': 'Где проблема?', 'acc.whereLauncher': 'В лаунчере', 'acc.whereSite': 'На сайте',
    'acc.whatLabel': 'Что случилось?', 'acc.whatPh': 'Что вы делали и что пошло не так?',
    'acc.uninstallTitle': 'Удаление лаунчера',
    'acc.uninstallHint': 'Удалит TnT Launcher и все его данные: сборки, моды, настройки, скин и загруженную Java. Другие лаунчеры, обычный Minecraft и ваш Bedrock не затрагиваются. О мирах лаунчер спросит отдельно.',
    'acc.uninstallBtn': 'Удалить лаунчер…',
    'acc.loggedInAs': 'Вы вошли как {name}',
    'acc.login': 'Войти', 'acc.siteFound': 'На сайте найден аккаунт', 'acc.siteFoundQ': 'Войти в лаунчер под этим аккаунтом?',
    'acc.noAccountIp': 'На сайте нет аккаунта для вашего IP-адреса. Введите код с сайта.',
    'acc.foundConfirm': 'На сайте найден аккаунт {name}. Войти как {name}?',
    'acc.claimConfirm': 'Войти в лаунчер как {name}?',
    'acc.siteToast': 'Войдите на сайте — лаунчер предложит войти под этим аккаунтом',
    'acc.codeHint': 'Введите код с сайта: 8 символов, например ABCD-2345',
    'acc.codeExpired': 'Код с сайта устарел. Войдите на сайте заново.',
    // ошибки
    'err.loginFirst': 'Сначала войдите в аккаунт', 'err.pickInst': 'Сначала выберите сборку', 'err.versionsLoading': 'Список версий ещё грузится',
    // обновления
    'upd.available': 'Доступна новая версия', 'upd.hint': 'Установите обновление, чтобы получить последние улучшения',
    'upd.later': 'Позже', 'upd.now': 'Обновить', 'upd.latest': 'У вас последняя версия',
    'upd.noReleases': 'На GitHub пока нет опубликованных релизов', 'upd.checkFailed': 'Не удалось проверить: {error}',
    'upd.stateNew': 'Доступна версия {version}', 'upd.downloading': 'Скачиваю обновление… {pct}%',
    'upd.installing': 'Устанавливаю обновление… лаунчер сам закроется и откроется заново',
    'upd.manual': 'Откройте скачанный файл и установите вручную', 'upd.downloadFailed': 'Не удалось скачать обновление',
    // отчёты и уведомления
    'report.thanks': 'Спасибо! Мы получили сообщение. Когда проблема будет решена, вы увидите уведомление здесь или на сайте.',
    'notif.solved': 'Ваша проблема решена!', 'notif.feature': 'Это оказалась фича',
    'notif.bodySolved': 'Спасибо за вашу преданность!', 'notif.bodyFeature': 'Спасибо за вашу преданность, но это была фича.',
    'notif.copied': 'Текст отзыва скопирован: если поле на форуме пустое, просто вставьте его',
    'notif.review': 'Оставить отзыв на форуме',
    // удаление лаунчера
    'un.q1': 'Удалить TnT Launcher?', 'un.willDelete': 'Будет удалено:', 'un.willDeleteList': 'приложение, все сборки с модами, настройки, ваш скин и загруженная Java.',
    'un.notTouched': 'Не затрагивается:', 'un.notTouchedList': 'другие лаунчеры, обычная папка .minecraft и ваш Minecraft Bedrock с его мирами.',
    'un.continue': 'Продолжить', 'un.qWorlds': 'Хотите удалить все ваши миры?', 'un.foundWorlds': 'В сборках найдено миров: <b>{n}</b>. Что с ними сделать?',
    'un.keepAll': 'Нет, оставьте', 'un.keepAllS': 'Сохраню все миры в папку, которую вы выберете',
    'un.keepSome': 'Нет, но только некоторые', 'un.keepSomeS': 'Выберу, какие миры оставить',
    'un.delAll': 'Да, удалить', 'un.delAllS': 'Миры будут удалены вместе с лаунчером',
    'un.qSome': 'Какие миры оставить?', 'un.qSomeHint': 'Отметьте миры, которые нужно сохранить. Остальные будут удалены.',
    'un.next': 'Выбрать папку', 'un.qFinal': 'Последнее подтверждение',
    'un.finalKeep': 'Сохраню миров: <b>{n}</b> → папка <b>{dest}</b> (внутри будет «TnT Launcher — сохранённые миры»). Остальные миры удалятся.',
    'un.finalDelAll': '<b>Все миры будут удалены без возможности восстановления.</b>', 'un.finalNoWorlds': 'Миров в сборках нет.',
    'un.thenQuits': 'Затем лаунчер закроется и удалится.', 'un.run': 'Удалить лаунчер', 'un.deleting': 'Удаляю…',
    'un.done': 'Готово', 'un.doneText': 'Лаунчер удаляется и сейчас закроется.', 'un.savedTo': 'Миры сохранены:', 'un.back': 'Назад', 'un.toCancel': 'Отмена',
    // язык
    'lang.changed': 'Язык изменён: Русский', 'lang.label': 'Language / Язык',
    // единицы и подписи
    'units.mb': ' МБ', 'units.gb': ' ГБ', 'units.m': ' млн', 'units.k': ' тыс',
    'part.head': 'Голова', 'part.body': 'Тело', 'part.armR': 'Пр. рука', 'part.legR': 'Пр. нога', 'part.armL': 'Лев. рука', 'part.legL': 'Лев. нога',
  },
  en: {
    // common
    'common.search': 'Search', 'common.save': 'Save', 'common.cancel': 'Cancel', 'common.no': 'No', 'common.yes': 'Yes',
    'common.delete': 'Delete', 'common.install': 'Install', 'common.installed': 'Installed', 'common.saved': 'Saved',
    'common.send': 'Send', 'common.close': 'Close', 'common.apply': 'Apply', 'common.reset': 'Reset',
    'common.forum': 'Forum', 'common.settings': 'Settings', 'common.searching': 'Searching…', 'common.checking': 'Checking…',
    'common.notFound': 'Nothing found',
    // sidebar
    'side.title': 'MY INSTANCES', 'side.bedrock': 'BEDROCK', 'side.for': 'for Minecraft', 'side.new': 'New',
    'nav.catalog': 'Modpack catalog', 'nav.skin': 'Skin editor', 'nav.account': 'Account & settings',
    'acct.guest': 'Guest', 'acct.none': 'no account selected', 'acc.offlineShort': 'offline',
    // play
    'play': 'PLAY', 'stop': 'STOP', 'launching': 'LAUNCHING…', 'prog.ready': 'Ready to launch',
    'q.folder': 'Game folder', 'q.folderTitle': 'Open the game folder', 'q.mods': 'Mods', 'q.rp': 'Resource packs', 'q.shaders': 'Shaders', 'q.saves': 'Worlds',
    'tab.files': 'Files', 'tab.mods': 'Mods', 'tab.set': 'Instance settings', 'tab.log': 'Log',
    // files
    'files.add': 'Add files', 'files.open': 'Open folder', 'files.root': 'Instance folder',
    'files.empty': 'Nothing here yet', 'files.enable': 'Enable', 'files.disable': 'Disable', 'files.disabledSuffix': ' · disabled',
    // mods
    'mods.hint': 'Modrinth mods matching this instance\'s version and loader. Required dependencies are installed automatically.',
    'mods.example': 'Try: Sodium, JEI, Iris…', 'mods.recommended': 'Recommended mods',
    'mods.noRec': 'No recommendations for this version', 'mods.notFound': 'Nothing found for this version and loader',
    'mods.vanillaWarn': 'Mods don\'t work in a Vanilla instance — pick Fabric or Forge in the instance settings',
    'deps.title': 'Install dependencies?', 'deps.ask': 'This mod may require dependencies. Install them?', 'deps.never': 'Don\'t ask again',
    'repair.title': 'Repair instance', 'repair.select': 'Pick one priority mod. The rest will be removed and the priority mod reinstalled.',
    'repair.none': 'No mods', 'repair.pick': 'Pick a mod', 'repair.working': 'Repairing…', 'repair.go': 'Repair', 'repair.done': 'Instance repaired',
    // instance settings
    'set.name': 'Name', 'set.version': 'Minecraft version', 'set.color': 'Instance color', 'set.loader': 'Loader',
    'set.ram': 'Memory (RAM)', 'set.shared': 'shared', 'set.jvm': 'JVM arguments', 'set.delete': 'Delete instance',
    'set.renameLocked': 'Stop the game to rename this instance',
    'confirm.deleteInst': 'Delete "{name}" with all its mods and worlds?',
    'new.title': 'New instance', 'new.namePh': 'Optional', 'new.version': 'Version', 'new.snapshots': 'show snapshots and old versions', 'new.create': 'Create',
    'inst.none': 'No instances yet', 'inst.noneHint': 'create your first one with the "New" button on the left',
    // catalog
    'cat.hint': 'Ready Modrinth modpacks are installed as separate instances with their own mods. You can also import your own .mrpack file.',
    'cat.example': 'Try: Fabulously Optimized, Better MC…', 'cat.import': 'Import .mrpack',
    'cat.installed': 'Instance "{name}" installed',
    // bedrock
    'bedrock.unsupported': 'Bedrock Edition is supported only on Windows. On this OS only Java Edition is available.',
    'be.folder': 'Data folder', 'be.addons': 'Add-ons', 'be.skins': 'Skin packs', 'be.tabFiles': 'Contents', 'be.tabCat': 'Add-on catalog',
    'be.installFile': 'Install file',
    'be.filesHint': '.mcaddon, .mcpack, .mcworld and .mctemplate files are supported. After installing, enable the pack in the world settings. If the game is running, restart it.',
    'be.catHint': 'Bedrock add-ons and packs from CurseForge. A free key is required (Settings tab). If the author disallowed program downloads, their page opens: download the file and press "Install file".',
    'be.example': 'Try: furniture, dragons, shaders…',
    'be.keyTitle': 'CurseForge key', 'be.keyHint': 'A free key is needed only to search and download add-ons from the catalog. Get one at console.curseforge.com (sign in with your account), paste it here and save.',
    'be.keyPh': 'CurseForge key', 'be.getKey': 'Get key', 'be.keySaved': 'Key saved', 'be.keyRemoved': 'Key removed',
    'be.aboutTitle': 'About Bedrock in the launcher',
    'be.about': 'The Bedrock game itself must be purchased and installed from Microsoft Store: the launcher does not download it. It launches the game, manages its packs and worlds and installs add-ons. The skin editor does not work for Bedrock. Bedrock is Windows-only.',
    'be.checking': 'checking…', 'be.winOnly': 'Windows only', 'be.installed': 'Installed', 'be.notInstalled': 'Not installed',
    'be.dirFound': 'data folder found', 'be.noDir': 'no data folder',
    'be.noteNotInstalledT': 'Bedrock game not found', 'be.noteNotInstalledS': 'Buy and install Minecraft for Windows from Microsoft Store. The "Play" button opens the store page.',
    'be.noteNoDirT': 'Data folder not created yet', 'be.noteNoDirS': 'Launch the game once via the "Play" button, then come back here: pack and world management will start working.',
    'be.noDirEmpty': 'Bedrock data folder not found yet', 'be.emptyPrefix': 'No', 'be.emptyRp': 'resource packs', 'be.emptyBp': 'add-ons', 'be.emptySp': 'skin packs', 'be.emptyWorlds': 'worlds',
    'be.launching': 'Launching Minecraft Bedrock…', 'be.store': 'Opened the Minecraft page in Microsoft Store',
    'be.manual': 'The author disallowed automatic downloads: opened their page. Download the file and press "Install file".', 'be.manualBtn': 'Download manually',
    'be.delConfirm': 'Delete "{name}"? This cannot be undone.',
    // skin
    'skin.hint': 'Paint right on the 3D model: rotate it with the mouse, zoom with the wheel. Ctrl+Z undoes, Ctrl+Y redoes.',
    'skin.view3d': '3D model', 'skin.view2d': 'Unwrap', 'skin.base': 'Base', 'skin.overlay': 'Overlay',
    'skin.showOverlay': 'show overlay', 'skin.undo': '↶ Undo', 'skin.redo': '↷ Redo',
    'skin.front': 'Front', 'skin.back': 'Back', 'skin.left': 'Left', 'skin.right': 'Right', 'skin.spin': 'Spin',
    'tool.pen': 'Pen', 'tool.erase': 'Eraser', 'tool.fill': 'Fill', 'tool.pick': 'Picker',
    'skin.customColor': 'Custom color', 'skin.slim': 'slim arms (Alex)', 'skin.guide': 'body part guides',
    'skin.nickPh': 'Premium nick', 'skin.fetch': 'Grab skin', 'skin.openPng': 'Open PNG', 'skin.clear': 'Clear',
    'skin.upload': 'Upload to Microsoft account', 'skin.restore': 'Restore previous account skin',
    'skin.apply': 'Play with this skin (offline)', 'skin.csl': 'Enable premium skins',
    'skin.restoreTitle': 'Restores the skin that was on your account before your last upload',
    'skin.applyTitle': 'Installs CustomSkinLoader and puts the skin into the instance',
    'skin.cslTitle': 'If your nick matches a premium one, the skin will load automatically',
    'skin.saved': 'Skin saved',
    'skin.uploadConfirm': 'This WILL change the skin of your Microsoft account everywhere: in other launchers (e.g. Lunar Client) and on servers.\n\nThe previous skin is backed up and can be restored with "Restore previous account skin".\n\nContinue?',
    'skin.uploaded': 'Skin uploaded to your account. The previous skin is backed up.', 'skin.uploadedNoBackup': 'Skin uploaded (couldn\'t back up the previous one).',
    'skin.restoreConfirm': 'Restore the skin that was on the account before your last upload from the launcher?',
    'skin.restored': 'Previous skin restored to the account and opened in the editor',
    'skin.fetched': 'Skin of player {name} loaded into the editor',
    'skin.applied': 'Skin for nick {nick} added to the instance', 'skin.cslInstalled': ' (CustomSkinLoader installed)',
    'skin.cslInstalledMsg': 'CustomSkinLoader installed: premium players\' skins will load by nick',
    'skin.cslPresent': 'CustomSkinLoader is already installed in this instance',
    // account
    'acc.offlineTitle': 'Offline mode', 'acc.offlineHint': 'For singleplayer and servers without license checks.',
    'acc.nickPh': 'Nick (3–16 characters)', 'acc.playOffline': 'Play offline',
    'acc.msTitle': 'Microsoft account', 'acc.msHint': 'For the licensed game. No links to copy.',
    'acc.loginCode': 'Sign in by code', 'acc.loginWindow': 'Sign in via window', 'acc.logout': 'Sign out',
    'acc.devStep1': 'Open', 'acc.devStep2': '(we\'ve already opened it in your browser) and enter the code:',
    'acc.copyCode': 'Copy code', 'acc.waiting': ' waiting for confirmation', 'acc.copied': 'Code copied',
    'acc.siteTitle': 'Sign in from the website',
    'acc.siteHint': 'Sign in via Microsoft on the TnT Launcher website and the account appears here: the launcher finds it by IP address, by the website button or by code.',
    'acc.openSite': 'Open website', 'acc.findAccount': 'Find account from website', 'acc.codePh': 'Code from website (XXXX-XXXX)', 'acc.loginByCode': 'Sign in by code',
    'acc.urlPh': 'Website URL (default https://tntlauncher.app)', 'acc.saveUrl': 'Save URL', 'acc.urlSaved': 'Website URL saved',
    'acc.updTitle': 'Updates', 'acc.updHint': 'Launcher version:', 'acc.updHint2': 'New versions come from GitHub.', 'acc.checkUpd': 'Check for updates',
    'acc.skinTitle': 'Skin without mods',
    'acc.skinHint': 'In offline mode the game will show the skin of the premium player with this nick: without mods, in singleplayer and LAN worlds. It\'s your skin if you enter the nick of your premium account (or any other). On servers others will see it only when you sign in via Microsoft: upload the skin in the "Skin" tab.',
    'acc.skinNickPh': 'Premium nick, e.g. Notch',
    'acc.skinNickNone': 'Not set: the default skin will be used in offline mode.',
    'acc.skinNickSet': 'Currently using the skin of player {name} (offline mode).',
    'acc.skinNickSaved': 'Skin of player {name} will be used in game', 'acc.skinNickCleared': 'Skin reset',
    'acc.ramTitle': 'Default memory', 'acc.ramHint': 'You can set a per-instance value in its settings.',
    'acc.reportTitle': 'Report a problem',
    'acc.reportHint': 'Tell us what\'s wrong: the message goes to the developers. We store your IP address (and nick if you\'re signed in via Microsoft) to notify you about the fix. The reply arrives here or on the website.',
    'acc.whereLabel': 'Where is the problem?', 'acc.whereLauncher': 'In the launcher', 'acc.whereSite': 'On the website',
    'acc.whatLabel': 'What happened?', 'acc.whatPh': 'What were you doing and what went wrong?',
    'acc.uninstallTitle': 'Uninstall the launcher',
    'acc.uninstallHint': 'Removes TnT Launcher and all its data: instances, mods, settings, skin and downloaded Java. Other launchers, vanilla .minecraft and your Bedrock are not touched. The launcher will ask about worlds separately.',
    'acc.uninstallBtn': 'Uninstall the launcher…',
    'acc.loggedInAs': 'Signed in as {name}',
    'acc.login': 'Sign in', 'acc.siteFound': 'Account found on the website:', 'acc.siteFoundQ': 'Sign in to the launcher with this account?',
    'acc.noAccountIp': 'No account from your IP address on the website. Enter the code from the website.',
    'acc.foundConfirm': 'Account {name} found on the website. Sign in as {name}?',
    'acc.claimConfirm': 'Sign in to the launcher as {name}?',
    'acc.siteToast': 'Sign in on the website — the launcher will offer to use that account',
    'acc.codeHint': 'Enter the code from the website: 8 characters, e.g. ABCD-2345',
    'acc.codeExpired': 'The code from the website has expired. Sign in on the website again.',
    // errors
    'err.loginFirst': 'Sign in to an account first', 'err.pickInst': 'Pick an instance first', 'err.versionsLoading': 'Version list is still loading',
    // updates
    'upd.available': 'New version available:', 'upd.hint': 'Install the update to get the latest improvements',
    'upd.later': 'Later', 'upd.now': 'Update', 'upd.latest': 'You have the latest version',
    'upd.noReleases': 'No published releases on GitHub yet', 'upd.checkFailed': 'Check failed: {error}',
    'upd.stateNew': 'Version {version} is available', 'upd.downloading': 'Downloading update… {pct}%',
    'upd.installing': 'Installing the update… the launcher will close and reopen by itself',
    'upd.manual': 'Open the downloaded file and install it manually', 'upd.downloadFailed': 'Failed to download the update',
    // reports and notifications
    'report.thanks': 'Thanks! We got your message. When the problem is fixed, you\'ll see a notification here or on the website.',
    'notif.solved': 'Your problem is fixed!', 'notif.feature': 'It turned out to be a feature',
    'notif.bodySolved': 'Thanks for your loyalty!', 'notif.bodyFeature': 'Thanks for your loyalty, but it was a feature.',
    'notif.copied': 'Review text copied: if the field on the forum is empty, just paste it',
    'notif.review': 'Leave a review on the forum',
    // uninstall
    'un.q1': 'Uninstall TnT Launcher?', 'un.willDelete': 'Will be removed:', 'un.willDeleteList': 'the app, all instances with mods, settings, your skin and the downloaded Java.',
    'un.notTouched': 'Not touched:', 'un.notTouchedList': 'other launchers, the vanilla .minecraft folder and your Minecraft Bedrock with its worlds.',
    'un.continue': 'Continue', 'un.qWorlds': 'Do you want to delete all your worlds?', 'un.foundWorlds': 'Found <b>{n}</b> worlds in instances. What should we do with them?',
    'un.keepAll': 'No, keep them', 'un.keepAllS': 'I\'ll save all worlds to a folder you choose',
    'un.keepSome': 'No, but only some', 'un.keepSomeS': 'I\'ll pick which worlds to keep',
    'un.delAll': 'Yes, delete', 'un.delAllS': 'Worlds will be deleted along with the launcher',
    'un.qSome': 'Which worlds to keep?', 'un.qSomeHint': 'Check the worlds to keep. The rest will be deleted.',
    'un.next': 'Choose folder', 'un.qFinal': 'Final confirmation',
    'un.finalKeep': 'Will save <b>{n}</b> worlds → folder <b>{dest}</b> (inside: «TnT Launcher — saved worlds»). Other worlds will be deleted.',
    'un.finalDelAll': '<b>All worlds will be deleted permanently.</b>', 'un.finalNoWorlds': 'No worlds in instances.',
    'un.thenQuits': 'Then the launcher will close and uninstall.', 'un.run': 'Uninstall', 'un.deleting': 'Uninstalling…',
    'un.done': 'Done', 'un.doneText': 'The launcher is being uninstalled and will close now.', 'un.savedTo': 'Worlds saved:', 'un.back': 'Back', 'un.toCancel': 'Cancel',
    // language
    'lang.changed': 'Language changed: English', 'lang.label': 'Language / Язык',
    // units and labels
    'units.mb': ' MB', 'units.gb': ' GB', 'units.m': 'M', 'units.k': 'K',
    'part.head': 'Head', 'part.body': 'Body', 'part.armR': 'R arm', 'part.legR': 'R leg', 'part.armL': 'L arm', 'part.legL': 'L leg',
  }
};
let currentLang = localStorage.getItem('lang') || 'ru';
function t(key, vars) {
  let s = (I18N[currentLang] || I18N.ru)[key] ?? I18N.ru[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(String(v));
  return s;
}
function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = val;
    else el.textContent = val;
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.documentElement.lang = currentLang;
  // Update dynamic texts
  if ($('#sideTitle')) $('#sideTitle').textContent = t('side.title');
  if ($('#playTxt')) $('#playTxt').textContent = S.busy ? t('launching') : S.playing ? t('stop') : t('play');
}
// плавная анимация при смене языка
function langAnimation() {
  document.body.classList.remove('lang-anim');
  void document.body.offsetWidth;                       // перезапуск CSS-анимации
  document.body.classList.add('lang-anim');
  clearTimeout(langAnimation.timer);
  langAnimation.timer = setTimeout(() => document.body.classList.remove('lang-anim'), 700);
}
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyI18n();
  // re-render current view if needed
  if (S.view === 'inst') renderInst();
  if (S.view === 'bedrock') renderBedrock();
  if (S.view === 'account') renderAccount();
  renderSide();
  langAnimation();
  toast(t('lang.changed'));
}
// переключатель языка в боковой панели
function initLangSwitcher() {
  const switcher = document.createElement('div');
  switcher.innerHTML = `<div class="field lang-field"><span>${t('lang.label')}</span><div class="seg"><button data-lang="ru" class="${currentLang==='ru'?'on':''}">Русский</button><button data-lang="en" class="${currentLang==='en'?'on':''}">English</button></div></div>`;
  switcher.onclick = e => { const b = e.target.closest('button'); if (b && b.dataset.lang !== currentLang) setLang(b.dataset.lang); };
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
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + t('units.m') : n >= 1e3 ? Math.round(n / 1e3) + t('units.k') : String(n);
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
  $('#bNew').hidden = bedrock; $('#sideTitle').textContent = bedrock ? t('side.bedrock') : t('side.title'); seg($('#edSeg'), S.edition);
  if (bedrock) {
    $('#instList').innerHTML = `<button class="inst ${S.view === 'bedrock' ? 'on' : ''}" data-id="bedrock" style="--c:#4da3ff">${av('B', '#4da3ff')}<div><b>Minecraft Bedrock</b><small>Windows</small></div></button>`;
  } else $('#instList').innerHTML = S.insts.map(i => `
    <button class="inst ${S.view === 'inst' && i.id === S.cur ? 'on' : ''}" data-id="${i.id}" style="--c:${esc(i.color)}">
      ${av(i.name, i.color)}<div><b>${esc(i.name)}</b><small>${esc(i.version)} · ${LOADER[i.loader]}</small></div></button>`).join('');
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.v === S.view));
  const a = S.st && S.st.account;
  $('#acctAv').outerHTML = av(a ? a.name : '?', a ? '#ffb82e' : '#4a5663', 'sm').replace('class="av sm"', 'class="av sm" id="acctAv"');
  $('#acctName').textContent = a ? a.name : t('acct.guest');
  $('#acctSub').textContent = a ? (a.type === 'microsoft' ? 'Microsoft' : t('acc.offlineShort')) : t('acct.none');
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
    $('#hName').textContent = t('inst.none');
    $('#hChips').innerHTML = `<span class="chip">${esc(t('inst.noneHint'))}</span>`;
    $('#bPlay').disabled = true; return;
  }
  hero.style.setProperty('--c', i.color);
  $('#hAv').outerHTML = av(i.name, i.color, 'xl').replace('class="av xl"', 'class="av xl" id="hAv"');
  $('#hName').textContent = i.name;
  $('#hChips').innerHTML = `<span class="chip">${esc(i.version)}</span><span class="chip ${i.loader}">${LOADER[i.loader]}</span><span class="chip">${((i.ram || S.st.ram) / 1024).toFixed(1)}${esc(t('units.gb'))}</span>`;
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
  list.innerHTML = files.map(f => `<label class="item"><input type="radio" name="prio" value="${esc(f.name)}"> ${esc(f.name)}</label>`).join('') || `<div class="empty">${esc(t('repair.none'))}</div>`;
  const dlg = $('#dRepair');
  dlg.showModal();
  $('#repairOk').onclick = async () => {
    const prio = list.querySelector('input:checked')?.value;
    if (!prio) { toast(t('repair.pick'), 'warn'); return; }
    dlg.close();
    toast(t('repair.working'));
    try {
      const r = await api.invoke('mods-repair', { id: S.cur, priority: prio });
      toast(r.message || t('repair.done'));
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
$('#bPlay').innerHTML = `<i data-i="play"></i><span id="playTxt">${t('play')}</span>`;
$('#bPlay').onclick = async () => {
  if (S.playing) { await api.invoke('stop'); return; }
  const i = cur(); if (!i) return;
  if (!S.st.account) { toast(t('err.loginFirst'), 'warn'); go('account'); return; }
  S.busy = true; setPlayUi(); setTab('log');
  try { await api.invoke('play', i.id); S.playing = true; await refresh(); }
  catch (e) {
    toast(errMsg(e), 'err'); log('Error: ' + errMsg(e)); setProg(t('prog.ready'), 0);
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
api.onClosed(() => { S.playing = false; S.busy = false; setPlayUi(); setProg(t('prog.ready'), 0); });
const logEl = $('#log');
function log(m) { logEl.textContent += String(m).replace(/\s+$/, '') + '\n'; if (logEl.textContent.length > 120000) logEl.textContent = logEl.textContent.slice(-80000); logEl.scrollTop = logEl.scrollHeight; }
api.onLog(log);

// -- файлы
async function renderFiles() {
  const i = cur(); if (!i) { $('#fList').innerHTML = ''; return; }
  const files = await api.invoke('files-list', { id: i.id, folder: S.folder });
  $('#fList').innerHTML = files.length ? files.sort((a, b) => a.name.localeCompare(b.name)).map(f => `
    <div class="item ${f.enabled ? '' : 'off'}" data-n="${esc(f.name)}">
      <span class="nm">${esc(f.name.replace(/\.disabled$/, ''))}</span><small>${f.size ? (f.size / 1048576).toFixed(2) + esc(t('units.mb')) : ''}${f.enabled ? '' : esc(t('files.disabledSuffix'))}</small>
      ${S.folder !== 'saves' ? `<button class="btn sm" data-a="t">${esc(f.enabled ? t('files.disable') : t('files.enable'))}</button>` : ''}
      <button class="btn sm danger" data-a="d">${esc(t('common.delete'))}</button></div>`).join('') : `<div class="empty">${esc(t('files.empty'))}</div>`;
}
$('#folderSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.folder = b.dataset.f; seg($('#folderSeg'), S.folder); renderFiles(); };
$('#fList').onclick = async e => {
  const b = e.target.closest('button'); if (!b) return;
  const name = b.closest('.item').dataset.n, arg = { id: S.cur, folder: S.folder, name };
  try {
    if (b.dataset.a === 't') await api.invoke('file-toggle', arg);
    else if (confirm(`${t('common.delete')} «${name}»?`)) await api.invoke('file-delete', arg);
    renderFiles();
  } catch (er) { toast(errMsg(er), 'err'); }
};
$('#fAdd').onclick = async () => { await api.invoke('file-add', { id: S.cur, folder: S.folder }); renderFiles(); };
$('#fOpen').onclick = () => api.invoke('inst-open', { id: S.cur, folder: S.folder });
$('#fRoot').onclick = () => api.invoke('inst-open', { id: S.cur });

// -- карточки Modrinth
const card = (h, btn) => `<div class="card-item" data-id="${esc(h.id)}" data-title="${esc(h.title)}">
  <div class="ci-ico">${h.icon ? `<img src="${esc(h.icon)}" alt="">` : esc(h.title[0])}</div>
  <div class="ci-body"><b>${esc(h.title)}</b><p>${esc(h.desc)}</p><small>${fmt(h.downloads)} · ${esc(h.author || '')}</small></div>
  <button class="btn primary sm" data-a="install">${btn}</button></div>`;
const skeleton = el => el.innerHTML = `<div class="empty">${esc(t('common.searching'))}</div>`;

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
    $('#mList').innerHTML = hits.length ? `<p class="hint">${esc(t('mods.recommended'))}</p>` + hits.map(h => card(h, t('common.install'))).join('') : `<div class="empty">${esc(t('mods.noRec'))}</div>`;
  } catch (e) { $('#mList').innerHTML = ''; }
}

async function searchMods() {
  const i = cur(); if (!i) return;
  if (i.loader === 'vanilla') { toast(t('mods.vanillaWarn'), 'warn'); return; }
  skeleton($('#mList'));
  try {
    const hits = await api.invoke('mods-search', { id: i.id, q: $('#mQ').value });
    $('#mList').innerHTML = hits.length ? hits.map(h => card(h, t('common.install'))).join('') : `<div class="empty">${esc(t('mods.notFound'))}</div>`;
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
      $('#depsList').textContent = t('deps.ask');
      const dlg = $('#dDeps');
      dlg.showModal();
      const yes = await new Promise(res => {
        $('#depsYes').onclick = () => { if ($('#depsNever').checked) localStorage.setItem('auto_download_deps', 'true'); res(true); dlg.close(); };
        $('#depsNo').onclick = () => { res(false); dlg.close(); };
      });
      if (!yes) { b.textContent = t('common.install'); b.disabled = false; return; }
    }
    const done = await api.invoke('mods-install', { id: S.cur, project: id });
    b.textContent = t('common.installed'); toast(t('common.installed') + ': ' + done.join(', ')); renderFiles();
  } catch (er) { b.textContent = t('common.install'); b.disabled = false; toast(errMsg(er), 'err'); }
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
const ramLabel = () => $('#sRamV').textContent = $('#sDef').checked ? `(${t('set.shared')})` : ($('#sRam').value / 1024).toFixed(1) + ' GB';
$('#sRam').oninput = () => { $('#sDef').checked = false; ramLabel(); };
$('#sDef').onchange = ramLabel;
$('#sLoader').onclick = e => { const b = e.target.closest('button'); if (b) seg($('#sLoader'), b.dataset.l); };
$('#sSave').onclick = async () => {
  try {
    await api.invoke('inst-update', { id: S.cur, patch: { name: $('#sName').value, version: $('#sVer').value, loader: segVal($('#sLoader')), jvm: $('#sJvm').value.trim(), ram: $('#sDef').checked ? null : +$('#sRam').value } });
    await refresh(); renderSide(); renderInst(); toast(t('common.saved'));
  } catch (e) { toast(errMsg(e), 'err'); }
};
$('#sDel').onclick = async () => {
  const i = cur(); if (!i || !confirm(t('confirm.deleteInst', { name: i.name }))) return;
  await api.invoke('inst-delete', i.id); await refresh(); go('inst');
};

// ---------- новая сборка ----------
$('#bNew').onclick = () => { $('#dName').value = ''; $('#dSnap').checked = false; fillVersions($('#dVer'), S.versions.find(v => v.type === 'release')?.id, false); seg($('#dLoader'), 'vanilla'); $('#dNew').showModal(); };
$('#dSnap').onchange = () => fillVersions($('#dVer'), $('#dVer').value, $('#dSnap').checked);
$('#dLoader').onclick = e => { const b = e.target.closest('button'); if (b) seg($('#dLoader'), b.dataset.l); };
$('#dCancel').onclick = () => $('#dNew').close();
$('#dOk').onclick = async () => {
  const v = $('#dVer').value; if (!v) { toast(t('err.versionsLoading'), 'warn'); return; }
  const i = await api.invoke('inst-create', { name: $('#dName').value, version: v, loader: segVal($('#dLoader')) });
  $('#dNew').close(); await refresh(); S.tab = 'files'; setTab('files'); select(i.id);
};

// ---------- каталог сборок ----------
async function searchPacks() {
  skeleton($('#pList'));
  try {
    const hits = await api.invoke('packs-search', $('#pQ').value);
    $('#pList').innerHTML = hits.length ? hits.map(h => card(h, t('common.install'))).join('') : `<div class="empty">${esc(t('common.notFound'))}</div>`;
  } catch (e) { $('#pList').innerHTML = ''; toast(errMsg(e), 'err'); }
}
$('#pGo').onclick = searchPacks;
$('#pQ').onkeydown = e => { if (e.key === 'Enter') searchPacks(); };
$('#pList').onclick = async e => {
  const b = e.target.closest('[data-a=install]'); if (!b) return;
  const c = b.closest('.card-item');
  b.textContent = '…'; b.disabled = true;
  try { const i = await api.invoke('packs-install', { project: c.dataset.id, title: c.dataset.title }); await refresh(); toast(t('cat.installed', { name: i.name })); select(i.id); }
  catch (er) { b.textContent = t('common.install'); b.disabled = false; toast(errMsg(er), 'err'); }
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
  const g = $('#gRam'); g.max = Math.max(2048, Math.floor(S.st.totalMemMB / 512) * 512); g.value = S.st.ram; $('#gRamV').textContent = (S.st.ram / 1024).toFixed(1) + t('units.gb');
}
async function onLogin(acc) { S.st.account = acc; renderSide(); renderAccount(); toast(t('acc.loggedInAs', { name: acc.name })); }
$('#bOff').onclick = async () => { try { await onLogin(await api.invoke('login-offline', $('#nick').value)); S.st.nick = $('#nick').value.trim(); } catch (e) { toast(errMsg(e), 'err'); } };
$('#bOut').onclick = async () => { await api.invoke('logout'); S.st.account = null; renderSide(); renderAccount(); };
$('#gRam').oninput = e => { S.st.ram = +e.target.value; $('#gRamV').textContent = (S.st.ram / 1024).toFixed(1) + t('units.gb'); api.invoke('set-ram', S.st.ram); };

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
$('#devCopy').onclick = () => { navigator.clipboard.writeText($('#devBox').dataset.code || '').then(() => toast(t('acc.copied'))); };
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
// подписи частей тела на развёртке (переводимые)
const PART_LABELS = () => ({ 'Голова': t('part.head'), 'Тело': t('part.body'), 'Пр. рука': t('part.armR'), 'Пр. нога': t('part.legR'), 'Лев. рука': t('part.armL'), 'Лев. нога': t('part.legL') });
function draw2d() {
  cx.imageSmoothingEnabled = false; cx.clearRect(0, 0, 448, 448);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { cx.fillStyle = (x + y) % 2 ? '#2a3541' : '#212b35'; cx.fillRect(x * 4 * SC, y * 4 * SC, 4 * SC, 4 * SC); }
  cx.drawImage(sk, 0, 0, 448, 448);
  if ($('#skGuide').checked) {
    cx.strokeStyle = '#ffb82e'; cx.lineWidth = 1; cx.font = '700 11px sans-serif'; cx.fillStyle = '#ffb82e';
    const labels = PART_LABELS();
    for (const [name, rects] of Object.entries(PARTS)) {
      rects.forEach(([x, y, w, h]) => cx.strokeRect(x * SC + .5, y * SC + .5, w * SC - 1, h * SC - 1));
      const [x, y, , h] = rects[1]; cx.fillText(labels[name] || name, x * SC + 2, y > 4 ? y * SC - 4 : (y + h) * SC + 12);
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
$('#skSave').onclick = async () => { if (await api.invoke('skin-save', sk.toDataURL('image/png'))) toast(t('skin.saved')); };
$('#skUp').onclick = async () => {
  if (!confirm(t('skin.uploadConfirm'))) return;
  try { const r = await api.invoke('skin-upload', { dataUrl: sk.toDataURL('image/png'), slim }); toast(r.backedUp ? t('skin.uploaded') : t('skin.uploadedNoBackup')); }
  catch (e) { toast(errMsg(e), 'err'); }
};
$('#skRestore').onclick = async () => {
  if (!confirm(t('skin.restoreConfirm'))) return;
  try { const r = await api.invoke('skin-restore'); await loadSkinUrl(r.dataUrl); setSlim(r.slim); toast(t('skin.restored')); }
  catch (e) { toast(errMsg(e), 'err'); }
};
$('#skFetch').onclick = async () => {
  try { const r = await api.invoke('skin-fetch', $('#skNick').value); await loadSkinUrl(r.dataUrl); setSlim(r.slim); toast(t('skin.fetched', { name: r.name })); }
  catch (e) { toast(errMsg(e), 'err'); }
};
$('#skApply').onclick = async () => {
  if (!S.cur) { toast(t('err.pickInst'), 'warn'); return; }
  try {
    const r = await api.invoke('skin-apply', { id: S.cur, dataUrl: sk.toDataURL('image/png') });
    toast(t('skin.applied', { nick: r.nick }) + (r.installed ? t('skin.cslInstalled') : '')); renderFiles();
  } catch (e) { toast(errMsg(e), 'err'); }
};
$('#skCsl').onclick = async () => {
  if (!S.cur) { toast(t('err.pickInst'), 'warn'); return; }
  try { const added = await api.invoke('csl-install', S.cur); toast(added ? t('skin.cslInstalledMsg') : t('skin.cslPresent')); renderFiles(); }
  catch (e) { toast(errMsg(e), 'err'); }
};

// ---------- обновления ----------
let updInfo = null;
async function checkUpdate(manual) {
  const r = await api.invoke('update-check');
  if (r.state === 'new') {
    updInfo = r; $('#updVer').textContent = r.version; $('#updBanner').hidden = false; $('#updBanner').title = r.notes || '';
    if (manual) $('#updState').textContent = t('upd.stateNew', { version: r.version });
  } else if (manual) {
    $('#updState').textContent = r.state === 'latest' ? t('upd.latest') : (/404/.test(r.error) ? t('upd.noReleases') : t('upd.checkFailed', { error: r.error }));
  }
}
$('#updLater').onclick = () => $('#updBanner').hidden = true;
$('#updNow').onclick = async () => {
  if (!updInfo || !updInfo.hasAsset) { api.invoke('open-release'); return; }
  $('#updNow').disabled = true; $('#updMsg').textContent = t('upd.downloading', { pct: 0 });
  try {
    const r = await api.invoke('update-install');
    $('#updMsg').textContent = r.quit ? t('upd.installing') : t('upd.manual');
  } catch (e) { toast(errMsg(e), 'err'); $('#updNow').disabled = false; $('#updMsg').textContent = t('upd.downloadFailed'); }
};
api.onUpdateProgress(f => $('#updMsg').textContent = t('upd.downloading', { pct: Math.round(f * 100) }));
$('#updCheck').onclick = () => { $('#updState').textContent = t('common.checking'); checkUpdate(true); };

// ---------- вход с сайта ----------
async function siteClaim(code) {
  try { await onLogin(await api.invoke('site-claim', code)); $('#siteBanner').hidden = true; }
  catch (e) { toast(errMsg(e), 'err'); }
}
$('#siteFind').onclick = async () => {
  const r = await api.invoke('site-peek');
  if (!r.found) { toast(t('acc.noAccountIp'), 'warn'); return; }
  if (confirm(t('acc.foundConfirm', { name: r.name }))) siteClaim();
};
let siteWatch = null;
$('#siteOpen').onclick = () => {
  api.invoke('site-open'); clearInterval(siteWatch); let n = 0;
  siteWatch = setInterval(async () => {
    if (++n > 150) { clearInterval(siteWatch); return; }
    const r = await api.invoke('site-peek');
    if (r.found) { clearInterval(siteWatch); $('#siteName').textContent = r.name; $('#siteBanner').hidden = false; }
  }, 4000);
  toast(t('acc.siteToast'));
};
$('#siteGo').onclick = () => { const c = $('#siteCode').value.trim(); if (c.replace(/[^A-Za-z0-9]/g, '').length < 8) { toast(t('acc.codeHint'), 'warn'); return; } siteClaim(c); };
$('#siteSave').onclick = async () => { try { S.st.site = await api.invoke('set-site', $('#siteUrl').value); $('#siteUrl').value = S.st.site; toast(t('acc.urlSaved')); } catch (e) { toast(errMsg(e), 'err'); } };
$('#siteYes').onclick = () => siteClaim();
$('#siteNo').onclick = () => $('#siteBanner').hidden = true;
api.onSiteCode(async code => {                       // пришли по кнопке «Открыть в лаунчере» на сайте
  go('account');
  const r = await api.invoke('site-peek', code);
  if (!r.found) { toast(t('acc.codeExpired'), 'warn'); return; }
  if (confirm(t('acc.claimConfirm', { name: r.name }))) siteClaim(code);
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
    $('#repText').value = ''; toast(t('report.thanks'));
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
  $('#notTitle').textContent = solved ? t('notif.solved') : t('notif.feature');
  $('#notBody').textContent = solved ? t('notif.bodySolved') : t('notif.bodyFeature');
  $('#notQuote').textContent = n.text;
  curReview = { title: solved ? 'Проблему починили!' : 'Какая фича есть!', body: solved ? pickRnd(SOLVED_REVIEWS) : pickRnd(FEATURE_REVIEWS)(n.text) };
  nDlg.showModal();
}
const ackNotif = () => { if (curN) api.invoke('notif-ack', curN.id); curN = null; };
$('#notClose').onclick = () => { nDlg.close(); ackNotif(); };
$('#notForum').onclick = async () => { await api.invoke('open-forum', curReview); toast(t('notif.copied')); nDlg.close(); ackNotif(); };
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
function showSkinNick() { $('#skinNick').value = S.st.skinNick || ''; $('#skinNickState').textContent = S.st.skinNick ? t('acc.skinNickSet', { name: S.st.skinNick }) : t('acc.skinNickNone'); }
$('#skinNickSave').onclick = async () => {
  try { const r = await api.invoke('set-skin-nick', $('#skinNick').value); S.st.skinNick = r.name || ''; showSkinNick(); toast(r.name ? t('acc.skinNickSaved', { name: r.name }) : t('acc.skinNickCleared')); }
  catch (e) { toast(errMsg(e), 'err'); }
};
$('#skinNickClear').onclick = async () => { await api.invoke('set-skin-nick', ''); S.st.skinNick = ''; showSkinNick(); toast(t('acc.skinNickCleared')); };

// ---------- Bedrock ----------
const BE_NAMES = { resource_packs: 'be.emptyRp', behavior_packs: 'be.emptyBp', skin_packs: 'be.emptySp', minecraftWorlds: 'be.emptyWorlds' };
let beKind = 'resource_packs', beInfo = null;
function beTab(t) {
  $$('#beTabs button').forEach(b => b.classList.toggle('on', b.dataset.bt === t));
  $$('#v-bedrock .bpane').forEach(p => p.classList.toggle('on', p.id === 'bp-' + t));
}
$('#beTabs').onclick = e => { const b = e.target.closest('button'); if (b) beTab(b.dataset.bt); };
async function renderBedrock() {
  $('#beAv').outerHTML = av('B', '#4da3ff', 'xl').replace('class="av xl"', 'class="av xl" id="beAv"');
  $('#beHero').style.setProperty('--c', '#4da3ff');
  $('#beChips').innerHTML = `<span class="chip">${esc(t('be.checking'))}</span>`;
  beInfo = await api.invoke('be-info');
  const note = (ti, s) => { $('#beNote').hidden = !ti; $('#beNoteT').textContent = ti || ''; $('#beNoteS').textContent = s || ''; };
  if (!beInfo.supported) {
    $('#beChips').innerHTML = `<span class="chip">${esc(t('be.winOnly'))}</span>`;
    note(t('bedrock.unsupported'), '');
    $('#beMain').hidden = true; $('#bePlay').disabled = true; $('#beQuick').hidden = true; $('#beText').textContent = ''; return;
  }
  $('#beMain').hidden = false; $('#bePlay').disabled = false; $('#beQuick').hidden = false;
  $('#beChips').innerHTML = `<span class="chip">${beInfo.installed ? esc(t('be.installed')) + (beInfo.version ? ' · ' + esc(beInfo.version) : '') : esc(t('be.notInstalled'))}</span><span class="chip">${beInfo.dir ? esc(t('be.dirFound')) : esc(t('be.noDir'))}</span>`;
  if (!beInfo.installed) note(t('be.noteNotInstalledT'), t('be.noteNotInstalledS'));
  else if (!beInfo.dir) note(t('be.noteNoDirT'), t('be.noteNoDirS'));
  else note();
  $('#beText').textContent = beInfo.dir || '';
  renderBeList();
}
async function renderBeList() {
  const box = $('#beList');
  if (!beInfo || !beInfo.dir) { box.innerHTML = `<div class="empty">${esc(t('be.noDirEmpty'))}</div>`; return; }
  let items = []; try { items = await api.invoke('be-list', beKind); } catch (e) { toast(errMsg(e), 'err'); }
  box.innerHTML = items.length ? items.map(x => `<div class="item" data-f="${esc(x.folder)}"><span class="nm">${esc(x.name)}</span><small>${esc(x.folder)}</small><button class="btn sm danger" data-a="d">${esc(t('common.delete'))}</button></div>`).join('')
    : `<div class="empty">${esc(t('be.emptyPrefix'))} ${esc(t(BE_NAMES[beKind]))}</div>`;
}
$('#beKindSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; beKind = b.dataset.k; seg($('#beKindSeg'), beKind); renderBeList(); };
$('#beList').onclick = async e => {
  const b = e.target.closest('[data-a=d]'); if (!b) return;
  const f = b.closest('.item').dataset.f;
  if (!confirm(t('be.delConfirm', { name: f }))) return;
  try { await api.invoke('be-delete', { kind: beKind, folder: f }); renderBeList(); } catch (er) { toast(errMsg(er), 'err'); }
};
$('#beQuick').onclick = async e => {
  const b = e.target.closest('button'); if (!b) return;
  try { const err = await api.invoke('be-open', b.dataset.be || undefined); if (err) toast(t('upd.checkFailed', { error: err }), 'err'); } catch (er) { toast(errMsg(er), 'err'); }
};
$('#bePlay').onclick = async () => {
  try { const r = await api.invoke('be-play'); toast(r.opened === 'game' ? t('be.launching') : t('be.store'), r.opened === 'game' ? '' : 'warn'); }
  catch (e) { toast(errMsg(e), 'err'); }
};
$('#beInstall').onclick = async () => {
  try { const r = await api.invoke('be-install-file'); if (r.length) { toast(t('common.installed') + ': ' + r.join(', ')); renderBeList(); } }
  catch (e) { toast(errMsg(e), 'err'); }
};
async function searchBe() {
  skeleton($('#beGrid'));
  try {
    const hits = await api.invoke('be-search', $('#beQ').value);
    $('#beGrid').innerHTML = hits.length ? hits.map(h => card(h, t('common.install'))).join('') : `<div class="empty">${esc(t('common.notFound'))}</div>`;
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
    if (r.manual) { b.textContent = t('be.manualBtn'); toast(t('be.manual'), 'warn'); }
    else { b.textContent = t('common.installed'); toast(t('common.installed') + ': ' + r.results.join(', ')); renderBeList(); }
  } catch (er) { b.textContent = t('common.install'); b.disabled = false; toast(errMsg(er), 'err'); }
};
$('#beKeySave').onclick = async () => { const ok = await api.invoke('set-curse-key', $('#beKey').value); toast(ok ? t('be.keySaved') : t('be.keyRemoved')); };
$('#beKeyGet').onclick = () => api.invoke('open-external', 'https://console.curseforge.com/');

// ---------- удаление лаунчера ----------
const un = $('#dUn'), unBody = $('#unBody');
let unWorlds = [], unKeep = [], unDest = null;
const unErr = t => { const el = $('#unErr'); if (el) el.textContent = t || ''; };
function unStep1() {
  unBody.innerHTML = `<h3>${esc(t('un.q1'))}</h3>
    <p><b>${esc(t('un.willDelete'))}</b> ${esc(t('un.willDeleteList'))}</p>
    <p><b>${esc(t('un.notTouched'))}</b> ${esc(t('un.notTouchedList'))}</p>
    <div class="row end"><button class="btn ghost" id="unNo">${esc(t('common.cancel'))}</button><button class="btn danger" id="unGo">${esc(t('un.continue'))}</button></div>`;
  $('#unNo').onclick = () => un.close();
  $('#unGo').onclick = async () => {
    try { unWorlds = await api.invoke('uninstall-scan'); } catch (e) { unWorlds = []; }
    unWorlds.length ? unStepWorlds() : unStepFinal([]);
  };
}
function unStepWorlds() {
  unBody.innerHTML = `<h3>${esc(t('un.qWorlds'))}</h3>
    <p>${t('un.foundWorlds', { n: unWorlds.length })}</p>
    <div class="un-actions">
      <button class="btn" id="unKeepAll">${esc(t('un.keepAll'))}<small>${esc(t('un.keepAllS'))}</small></button>
      <button class="btn" id="unKeepSome">${esc(t('un.keepSome'))}<small>${esc(t('un.keepSomeS'))}</small></button>
      <button class="btn danger" id="unDelAll">${esc(t('un.delAll'))}<small>${esc(t('un.delAllS'))}</small></button>
    </div><div class="row end"><button class="btn ghost" id="unNo">${esc(t('common.cancel'))}</button></div>`;
  $('#unNo').onclick = () => un.close();
  $('#unKeepAll').onclick = () => unPickDest(unWorlds);
  $('#unKeepSome').onclick = unStepSome;
  $('#unDelAll').onclick = () => unStepFinal([]);
}
function unStepSome() {
  unBody.innerHTML = `<h3>${esc(t('un.qSome'))}</h3><p>${esc(t('un.qSomeHint'))}</p>
    <div class="un-list">${unWorlds.map((w, k) => `<label><input type="checkbox" data-k="${k}" checked><span>${esc(w.world)}</span><small>${esc(w.inst)}</small></label>`).join('')}</div>
    <div class="row end"><button class="btn ghost" id="unBack">${esc(t('un.back'))}</button><button class="btn primary" id="unNext">${esc(t('un.next'))}</button></div><div class="un-err" id="unErr"></div>`;
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
  const text = keep.length ? t('un.finalKeep', { n: keep.length, dest: esc(dest) })
    : unWorlds.length ? t('un.finalDelAll') : t('un.finalNoWorlds');
  unBody.innerHTML = `<h3>${esc(t('un.qFinal'))}</h3><p>${text}</p><p>${esc(t('un.thenQuits'))}</p>
    <div class="row end"><button class="btn ghost" id="unBack">${esc(t('un.toCancel'))}</button><button class="btn danger" id="unRun">${esc(t('un.run'))}</button></div><div class="un-err" id="unErr"></div>`;
  $('#unBack').onclick = () => un.close();
  $('#unRun').onclick = async () => {
    $('#unRun').disabled = true; $('#unRun').textContent = t('un.deleting');
    try {
      const r = await api.invoke('uninstall-run', { keep: unKeep, dest: unDest });
      unBody.innerHTML = `<h3>${esc(t('un.done'))}</h3><p>${esc(t('un.doneText'))}${r.savedTo ? '<br>' + esc(t('un.savedTo')) + ' <b>' + esc(r.savedTo) + '</b>' : ''}</p>`;
    } catch (e) { $('#unRun').disabled = false; $('#unRun').textContent = t('un.run'); unErr(errMsg(e)); }
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
