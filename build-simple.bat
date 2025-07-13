@echo off
echo Building installer...
npm run build
npx electron-builder --publish=never
echo Done!
pause 