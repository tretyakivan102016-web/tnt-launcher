#!/bin/bash
# Одна команда для Mac: собирает установщики для Apple Silicon и Intel
# Полную сборку под Windows + Linux лучше делать через GitHub Actions (уже настроено)

cd "$(dirname "$0")"

echo "=== TnT Launcher: сборка всех Mac-версий ==="

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js не найден. Установите LTS с https://nodejs.org"
  open https://nodejs.org
  exit 1
fi

export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"

echo "Устанавливаю зависимости..."
npm install

echo "Собираю DMG для arm64 (Apple Silicon) и x64 (Intel)..."
npm run dist:mac

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Готово! Все установщики собраны в папке dist/:"
echo ""
ls -lh dist/ 2>/dev/null || echo "Файлы не найдены"
echo ""
echo "Скопируй содержимое dist/ в одну папку для загрузки на GitHub."
echo "Для Windows, Linux и телефона используй GitHub Actions (тег v*) — он соберёт всё автоматически в один Release."
else
  echo "❌ Сборка не удалась. Скопируйте ошибку выше."
fi

read -p "Нажмите Enter для выхода"
