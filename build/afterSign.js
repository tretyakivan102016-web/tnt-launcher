// Ad-hoc подпись macOS: electron-builder 24 не умеет identity:'-', поэтому подписываем сами после сборки.
// Ad-hoc (ключ «-») бесплатен и не требует Apple Developer: Gatekeeper перестаёт считать приложение
// «повреждённым» — открывается правым кликом → «Открыть» без всякого терминала.
const { execSync } = require('child_process');
const path = require('path');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appName = context.packager.appInfo.productFilename;
  const app = path.join(context.appOutDir, `${appName}.app`);
  try {
    execSync(`codesign --force --deep --sign - "${app}"`, { stdio: 'inherit' });
    execSync(`codesign --verify --deep "${app}"`, { stdio: 'inherit' });
    console.log(`afterSign: ad-hoc подпись применена к ${app}`);
  } catch (e) {
    console.error('afterSign: не удалось подписать (продолжаем без подписи):', e.message);
  }
};
