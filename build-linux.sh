#!/bin/bash
# Сборка TnT Launcher для Linux (AppImage и .deb). Запуск: bash build-linux.sh
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then echo "Нужен Node.js 18+ (nodejs.org или через пакетный менеджер)"; exit 1; fi
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm install && npm run dist:linux && echo "Готово: файлы лежат в папке dist (AppImage и deb)" || echo "Сборка не удалась. Пришлите текст ошибки."
