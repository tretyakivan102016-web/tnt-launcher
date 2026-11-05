TnT Launcher — Android-версия
==============================

Приложение-оболочка: открывает сайт tntlauncher.app (скачивание, аккаунт, форум, поддержка)
и показывает последний релиз через API сайта (/api/release). Нативный код — Java, без внешних
зависимостей (только стандартный Android SDK), minSdk 24 (Android 7.0), targetSdk 34.

Как собрать самому
------------------
Вариант 1 (на любом компьютере с JDK 17): установите Gradle 8.7+ и выполните в этой папке:
    gradle assembleRelease
Готовый файл: app/build/outputs/apk/release/app-release.apk

Вариант 2 (проще всего): GitHub Actions собирает APK автоматически.
    GitHub → ваш репозиторий → Actions → «Build Android APK» → Run workflow.
    Или просто создайте тег v1.6.1 и т.д. — APK приложится к релизу сам.

Установка .apk на телефон
-------------------------
Скачайте файл, откройте его на телефоне → разрешите установку из этого источника → готово.
(APK подписан отладочным ключом — подходит для теста. Для Google Play нужен свой ключ, см. ниже.)

Свой ключ подписи (нужен для Google Play)
-----------------------------------------
1. keytool -genkeypair -v -keystore tnt-release.keystore -alias tnt -keyalg RSA -keysize 2048 -validity 10000
2. В android/app/build.gradle добавьте signingConfigs.release с путём к keystore, паролями и alias
   (пароли держите в переменных окружения или в local.properties — НЕ коммитьте keystore и пароли).
3. Соберите набор для Play: gradle bundleRelease → app/build/outputs/bundle/release/app-release.aab
