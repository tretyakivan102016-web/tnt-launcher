# TnT Launcher

Лаунчер Minecraft: Java и Bedrock в одном окне, свои сборки, Fabric и Forge, моды и сборки с Modrinth,
автоустановка Java, 3D-редактор скина, вход через Microsoft или по нику.

Сайт: https://tntlauncher.app · Поддержка: https://tntlauncher.app/support · Форум: https://forum.tntlauncher.app

## Скачать

Готовые установщики — на странице [Releases](https://github.com/tretyakivan102016-web/tnt-launcher/releases/latest):

| Система | Файл |
|---|---|
| Windows 10/11 x64 | `TnT-Launcher-Setup-<версия>.exe` |
| macOS Apple Silicon | `TnT-Launcher-<версия>-arm64.dmg` |
| macOS Intel | `TnT-Launcher-<версия>-x64.dmg` |
| Linux | `TnT-Launcher-<версия>.AppImage` или `.deb` |
| Android | `TnT-Launcher-<версия>.apk` |

## Запуск из исходников

```bash
npm install
npm start          # режим разработки
```

## Сборка установщиков

```bash
npm run dist:win     # Windows (.exe, NSIS)
npm run dist:mac     # macOS (.dmg) — только на macOS
npm run dist:linux   # Linux (AppImage + deb)
```

На Windows AppImage и deb собираются кросс-компиляцией; macOS-версия собирается автоматически
через GitHub Actions при пуше тега `v*` (workflow «Build and release»).
Android-версия — в папке [android/](android/), см. [android/README-android.txt](android/README-android.txt).

## Структура

- `main.js` — процесс Electron: запуск игры, аккаунты, моды, скины, Bedrock, обновления
- `renderer/` — интерфейс лаунчера
- `android/` — Android-версия (WebView-оболочка сайта + проверка релиза через API)
- `.github/workflows/` — автосборка релизов (десктоп + APK) по тегу `v*`

Лаунчер не связан с Mojang и Microsoft.
