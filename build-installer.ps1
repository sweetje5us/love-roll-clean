Write-Host "Building Love & Roll installer..." -ForegroundColor Green

# Переходим в папку скрипта
Set-Location $PSScriptRoot

Write-Host "Building React app..." -ForegroundColor Yellow
npm run build

Write-Host "Creating installer..." -ForegroundColor Yellow
npm run dist

Write-Host "Build complete! Check the release folder for:" -ForegroundColor Green
Write-Host "- Love & Roll Setup.exe (NSIS installer)" -ForegroundColor Cyan
Write-Host "- Love & Roll.exe (portable version)" -ForegroundColor Cyan
Write-Host "- Love & Roll-win32-x64.zip (zipped version)" -ForegroundColor Cyan

Read-Host "Press Enter to continue" 