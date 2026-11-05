# Цифровая подпись TnT Launcher

Вся инфраструктура подписи уже настроена. Ниже — что уже работает, что нужно докупить и как подключить за 10 минут.

## Кратко: что чем подписывается

| Платформа | Статус | Что нужно |
|---|---|---|
| **Android (.apk/.aab)** | ✅ **Готово и работает уже сейчас** | Ничего: ключ сгенерирован, лежит на компьютере |
| **Windows (.exe)** | ⚙️ Инфраструктура готова | Купить сертификат подписи кода и добавить 2 секрета на GitHub |
| **macOS (.dmg)** | ⚙️ Инфраструктура готова | Apple Developer ($99/год) + секреты; для полного комфорта — нотаризация |

Важная правда про Windows: **без купленного сертификата SmartScreen будет предупреждать** — это нельзя обойти технически. Репутация «безопасно» появляется через некоторое время после распространения подписанных сборок или сразу с EV-сертификатом.

---

## 1. Android — уже готово ✅

Ключ подписи сгенерирован и лежит локально:

```
tnt-launcher/android/keystore/tnt-release.p12        ← ключ (НИКОМУ не передавать, в git не попадает)
tnt-launcher/android/keystore/tnt-release.password.txt  ← пароль и alias
tnt-launcher/android/keystore/ANDROID_KEYSTORE_BASE64.txt ← то же, в base64 (для GitHub-секрета)
```

Файлы исключены из git (`.gitignore`), ключ живёт 30 лет. **Сделайте резервную копию** этих файлов (облако + флешка): если ключ потеряется — обновление в Google Play придётся выпускать как новое приложение.

### Подключение к GitHub Actions (5 минут)
1. Откройте https://github.com/tretyakivan102016-web/tnt-launcher/settings/secrets/actions
2. Нажмите **New repository secret** и добавьте 4 секрета:

| Имя секрета | Значение |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | содержимое файла `ANDROID_KEYSTORE_BASE64.txt` (одна длинная строка) |
| `ANDROID_KEYSTORE_PASSWORD` | пароль из `tnt-release.password.txt` |
| `ANDROID_KEY_ALIAS` | `tnt` |
| `ANDROID_KEY_PASSWORD` | тот же пароль |

3. Готово: с этого момента APK в релизах подписываются вашим ключом автоматически. Секреты GitHub зашифрованы и не видны никому, даже при публичном репозитории.

### Сборка APK со своим ключом у себя
Нужен JDK 17. Локально достаточно просто положить p12 рядом (он уже там) — `gradle assembleRelease` подхватит его из `android/keystore/`.

### Google Play
Для Play загружается `.aab` (`gradle bundleRelease`), а саму подпись в сторе делает **Play App Signing** — ваш ключ нужен только для первой загрузки. Подробнее: `android/README-android.txt`.

---

## 2. Windows (.exe) — покупка сертификата

electron-builder уже настроен: как только в GitHub появятся секреты `CSC_LINK` и `CSC_KEY_PASSWORD`, установщики Windows начнут подписываться автоматически при каждом релизе (и локально: те же переменные окружения + `npm run dist:win`).

### Где купить (цены ориентировочные, 2025)
| Удостоверяющий центр | Цена | Кому | Примечание |
|---|---|---|---|
| **Certum** (certum.eu) | ~€25–79/год | физлица и ИП | самый дешёвый вход, есть «Open Source Code Signing»; ключ на облаке SimplySign |
| **Sectigo / SSL.com** (OV) | ~$120–250/год | физлица/компании | ключ на USB-токене или в облаке |
| **DigiCert / Sectigo (EV)** | ~$250–500/год | юрлица | мгновенная репутация SmartScreen, ключ на токене |
| **Azure Trusted Signing** | $9.99/мес | по проверке | облачная подпись, есть официальный GitHub Action; доступ ограничен по странам |

⚠️ С июня 2023 все сертификаты выдаются на аппаратных токенах или в облаке (экспорт в `.p12` часто невозможен). Поэтому:
- для **GitHub Actions** удобнее всего облачные варианты (Azure Trusted Signing, SSL.com eSigner) либо экспортируемый `.p12` у Certum/Sectigo;
- для **локальной подписи** на своём ПК подойдёт любой вариант: `set CSC_LINK=... && set CSC_KEY_PASSWORD=... && npm run dist:win`.

### Как подключить
1. Купите сертификат, пройдите проверку личности.
2. Получите сертификат в виде `.p12` (если выдали на токене — попросите у ЦС вариант с облачным хранением или подписывайте локально на ПК с токеном).
3. Переведите `.p12` в base64 (команда: `certutil -encode cert.p12 cert.b64`, затем скопируйте содержимое между BEGIN/END, одной строкой) — или используйте содержимое как есть в секрете с переносами: CI их уберёт.
4. GitHub → Settings → Secrets → Actions → добавьте:
   - `CSC_LINK` — base64 или data-URI (`data:application/x-pkcs12;base64,....`)
   - `CSC_KEY_PASSWORD` — пароль от .p12
5. Следующий релиз (тег `v*`) соберётся уже подписанным. Проверка: правой кнопкой по .exe → Свойства → Цифровые подписи.

---

## 3. macOS (.dmg)

1. Apple Developer Program — https://developer.apple.com ($99/год).
2. Xcode → сертификат **Developer ID Application**, экспортируйте в `.p12`.
3. Секреты GitHub:
   - `CSC_LINK` / `CSC_KEY_PASSWORD` — тот же механизм, что и для Windows (можно указать mac-сертификат теми же секретами, electron-builder сам выберет подходящий на каждой ОС);
   - для нотаризации (убирает предупреждение Gatekeeper полностью): `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` (создаётся на appleid.apple.com), `APPLE_TEAM_ID`, и в `package.json` поменять `"notarize": false` на `"notarize": true`.
4. Без сертификата сборки идут как раньше (без подписи) — ничего не сломается.

---

## Что уже сделано в коде

- `package.json` → `build.mac`: убран жёсткий `identity: null`, добавлен `notarize: false` — сертификат из секретов подхватится, без него поведение прежнее.
- `.github/workflows/build.yml` → проброс `CSC_LINK`, `CSC_KEY_PASSWORD`, `CSC_IDENTITY_AUTO_DISCOVERY=false`, переменных нотаризации Apple.
- `android/app/build.gradle` → release-подпись из env (`TNT_KEYSTORE` может быть путём ИЛИ base64) или из локального `android/keystore/`, с фолбэком на отладочный ключ.
- `.github/workflows/android.yml` → проброс секретов `ANDROID_KEYSTORE_*` в Gradle.
- `android/keystore/` и `*.p12` → в `.gitignore` (ключ никогда не попадёт в репозиторий).
