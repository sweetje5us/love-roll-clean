@echo off
echo Building Love & Roll application...
cd /d "%~dp0"

echo Building React app...
call npm run build

echo Creating executable...
node node_modules\electron-builder\cli.js --publish=never

echo Build complete! Check the dist folder.
pause 