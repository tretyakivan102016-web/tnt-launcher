@echo off
chcp 65001 >nul
cd /d "%~dp0"
net session >nul 2>&1
if errorlevel 1 goto elevate
echo === TnT Launcher: сборка установщика для Windows ===
where node >nul 2>nul
if errorlevel 1 goto nonode
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
echo Устанавливаю зависимости (несколько минут)...
call npm install
if errorlevel 1 goto fail
echo Собираю установщик...
call npm run dist:win
if errorlevel 1 goto fail
echo.
echo Готово! Установщик лежит в папке dist (TnT-Launcher-Setup-*.exe)
start "" dist
pause
exit /b 0
:elevate
echo Запрашиваю права администратора, они нужны для сборки...
powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
exit /b
:nonode
echo Не найден Node.js. Сейчас откроется сайт: скачайте версию LTS, установите и запустите этот файл снова.
start https://nodejs.org
pause
exit /b 1
:fail
echo.
echo Сборка не удалась. Скопируйте текст ошибки выше и пришлите мне.
pause
exit /b 1
