#!/bin/bash
cd "$(dirname "$0")"
echo "=== TnT Launcher: сборка для macOS ==="
if ! command -v node >/dev/null 2>&1; then
  echo "Не найден Node.js. Откроется сайт: скачайте версию LTS, установите и запустите снова."
  open https://nodejs.org; read -p "Enter"; exit 1
fi
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm install && npm run dist:mac && { echo "Готово! Откройте .dmg в папке dist"; open dist; } || echo "Сборка не удалась. Пришлите ошибку выше."
read -p "Нажмите Enter для выхода"
