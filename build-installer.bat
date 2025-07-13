@echo off
echo Building Love & Roll installer...
cd /d "%~dp0"

echo Building React app...
call npm run build

echo Creating installer...
call npm run dist

echo Build complete! Check the release folder for:
echo - Love ^& Roll Setup.exe (NSIS installer)
echo - Love ^& Roll.exe (portable version)
echo - Love ^& Roll-win32-x64.zip (zipped version)

pause 